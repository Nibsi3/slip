/**
 * Server-side Firebase Cloud Messaging push notification sender.
 * Uses the FCM HTTP v1 API with a service account.
 *
 * Requires env: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string of service account)
 */

interface FcmMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

let _accessToken: { token: string; expiresAt: number } | null = null;

async function getFcmAccessToken(): Promise<string | null> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  // Return cached token if still valid (with 60s buffer)
  if (_accessToken && _accessToken.expiresAt > Date.now() + 60_000) {
    return _accessToken.token;
  }

  try {
    const sa = JSON.parse(raw) as {
      client_email: string;
      private_key: string;
      project_id: string;
    };

    // Build JWT for Google OAuth2 token endpoint
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claim = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    ).toString("base64url");

    const { createSign } = await import("crypto");
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    const sig = signer.sign(sa.private_key, "base64url");
    const jwt = `${header}.${claim}.${sig}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) {
      console.error("[FCM] Failed to get access token:", await res.text());
      return null;
    }

    const json = await res.json() as { access_token: string; expires_in: number };
    _accessToken = {
      token: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return _accessToken.token;
  } catch (e) {
    console.error("[FCM] Access token error:", e);
    return null;
  }
}

function getProjectId(): string | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { project_id: string }).project_id;
  } catch {
    return null;
  }
}

export async function sendPushNotification(msg: FcmMessage): Promise<boolean> {
  const token = await getFcmAccessToken();
  const projectId = getProjectId();
  if (!token || !projectId) {
    console.warn("[FCM] Push not configured — skipping");
    return false;
  }

  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: msg.token,
            notification: { title: msg.title, body: msg.body },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
              },
            },
            data: msg.data ?? {},
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[FCM] Send error:", err);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[FCM] Send exception:", e);
    return false;
  }
}

export async function sendPushToWorker(
  workerId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const { db } = await import("@/lib/db");
    const worker = await db.worker.findUnique({
      where: { id: workerId },
      select: { fcmToken: true },
    });
    if (!worker?.fcmToken) return;
    await sendPushNotification({ token: worker.fcmToken, title, body, data });
  } catch (e) {
    console.error("[FCM] sendPushToWorker error:", e);
  }
}

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Slip a Tip <register@slipatip.co.za>";
const ADMIN_EMAIL = "register@slipatip.co.za";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://slipatip.co.za";

// ─── Admin notification: new application submitted ───────────────────────────
export async function sendNewApplicationEmail(worker: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  jobTitle: string;
  employerName?: string | null;
  city: string;
  province?: string | null;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Worker Application – ${worker.firstName} ${worker.lastName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">New Worker Application</h2>
          <p style="color:#888;margin:0 0 24px;">A new worker has applied and is awaiting your approval.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Name</td><td style="padding:8px 0;color:#fff;font-weight:600;">${worker.firstName} ${worker.lastName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;color:#fff;">${worker.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;color:#fff;">${worker.email || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Job Title</td><td style="padding:8px 0;color:#fff;">${worker.jobTitle}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Employer</td><td style="padding:8px 0;color:#fff;">${worker.employerName || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Location</td><td style="padding:8px 0;color:#fff;">${worker.city}${worker.province ? `, ${worker.province}` : ""}</td></tr>
          </table>
          <div style="margin-top:32px;">
            <a href="${APP_URL}/admin/workers" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Review Application →</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendNewApplicationEmail failed:", err);
  }
}

// ─── Admin notification: new QR-code registration ────────────────────────────
export async function sendNewRegistrationEmail(worker: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Worker Registration – ${worker.firstName} ${worker.lastName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">New Worker Registration</h2>
          <p style="color:#888;margin:0 0 24px;">A worker registered via QR code and is now active.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Name</td><td style="padding:8px 0;color:#fff;font-weight:600;">${worker.firstName} ${worker.lastName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;color:#fff;">${worker.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;color:#fff;">${worker.email || "—"}</td></tr>
          </table>
          <div style="margin-top:32px;">
            <a href="${APP_URL}/admin/workers" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Workers →</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendNewRegistrationEmail failed:", err);
  }
}

// ─── Worker notification: application approved ───────────────────────────────
export async function sendApprovalEmail(worker: {
  firstName: string;
  email?: string | null;
}) {
  if (!worker.email) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: worker.email,
      subject: "Your Slip a Tip account has been approved! 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">You're approved, ${worker.firstName}! 🎉</h2>
          <p style="color:#888;margin:0 0 24px;">Your Slip a Tip worker account has been approved. You can now log in and start accepting tips.</p>
          <div style="margin-top:32px;">
            <a href="${APP_URL}/auth/login" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Log In to Your Account →</a>
          </div>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendApprovalEmail failed:", err);
  }
}

// ─── Worker notification: application rejected ───────────────────────────────
export async function sendRejectionEmail(worker: {
  firstName: string;
  email?: string | null;
  reason?: string;
}) {
  if (!worker.email) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: worker.email,
      subject: "Update on your Slip a Tip application",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">Application Update</h2>
          <p style="color:#888;margin:0 0 16px;">Hi ${worker.firstName}, unfortunately your Slip a Tip application could not be approved at this time.</p>
          ${worker.reason ? `<p style="color:#e0e0e0;background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #7c3aed;">${worker.reason}</p>` : ""}
          <p style="color:#888;margin-top:16px;">If you believe this is an error or would like to reapply, please contact us at <a href="mailto:support@slipatip.co.za" style="color:#7c3aed;">support@slipatip.co.za</a>.</p>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendRejectionEmail failed:", err);
  }
}

// ─── Worker notification: account deactivated ────────────────────────────────
export async function sendDeactivationEmail(worker: {
  firstName: string;
  email?: string | null;
  reason?: string;
}) {
  if (!worker.email) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: worker.email,
      subject: "Your Slip a Tip account has been deactivated",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">Account Deactivated</h2>
          <p style="color:#888;margin:0 0 16px;">Hi ${worker.firstName}, your Slip a Tip account has been temporarily deactivated.</p>
          ${worker.reason ? `<p style="color:#e0e0e0;background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #ef4444;">${worker.reason}</p>` : ""}
          <p style="color:#888;margin-top:16px;">Contact <a href="mailto:support@slipatip.co.za" style="color:#7c3aed;">support@slipatip.co.za</a> for assistance.</p>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendDeactivationEmail failed:", err);
  }
}

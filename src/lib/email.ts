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

// ─── Admin notification: balance cap overflow (tip paid but worker at cap) ───
export async function sendBalanceCapOverflowEmail(data: {
  workerName: string;
  workerId: string;
  tipPaymentId: string;
  netAmount: number;
  currentBalance: number;
  balanceCap: number;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `⚠️ Balance Cap Overflow – ${data.workerName} – R${data.netAmount.toFixed(2)} held`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <h2 style="color:#f59e0b;margin:0 0 8px;">⚠️ Balance Cap Overflow</h2>
          <p style="color:#888;margin:0 0 24px;">A completed tip payment could not be credited because the worker is at their balance cap. The funds are held and require manual review.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:160px;">Worker</td><td style="padding:8px 0;color:#fff;font-weight:600;">${data.workerName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Worker ID</td><td style="padding:8px 0;color:#fff;">${data.workerId}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Payment ID</td><td style="padding:8px 0;color:#fff;">${data.tipPaymentId}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Tip Net Amount</td><td style="padding:8px 0;color:#f59e0b;font-weight:600;">R${data.netAmount.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Current Balance</td><td style="padding:8px 0;color:#fff;">R${data.currentBalance.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Balance Cap</td><td style="padding:8px 0;color:#fff;">R${data.balanceCap.toFixed(2)}</td></tr>
          </table>
          <p style="color:#888;margin-top:16px;font-size:13px;">Action required: The tip was marked COMPLETED in the database but the worker balance was NOT credited. You should either refund the customer via Paystack or raise the worker's balance cap and manually credit.</p>
          <div style="margin-top:24px;">
            <a href="${APP_URL}/admin/workers" style="background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Workers →</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendBalanceCapOverflowEmail failed:", err);
  }
}

// ─── Worker notification: password reset ─────────────────────────────────────
export async function sendPasswordResetEmail(worker: {
  firstName: string;
  email: string;
  resetToken: string;
}) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${worker.resetToken}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: worker.email,
      subject: "Reset your Slip a Tip password",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">Reset Your Password</h2>
          <p style="color:#888;margin:0 0 24px;">Hi ${worker.firstName}, click the button below to reset your password. This link expires in 1 hour.</p>
          <div style="margin-bottom:32px;">
            <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password →</a>
          </div>
          <p style="color:#555;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err);
  }
}

// ─── Admin notification: chargeback received ─────────────────────────────────
export async function sendChargebackNotificationEmail(data: {
  workerName: string;
  tipPaymentId: string;
  disputeAmount: number;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `⚠️ Chargeback Received – R${data.disputeAmount.toFixed(2)} – ${data.workerName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#ef4444;margin:0 0 8px;">⚠️ Chargeback Received</h2>
          <p style="color:#888;margin:0 0 24px;">A chargeback dispute has been raised via Paystack.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:160px;">Worker</td><td style="padding:8px 0;color:#fff;font-weight:600;">${data.workerName}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Payment ID</td><td style="padding:8px 0;color:#fff;">${data.tipPaymentId}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Dispute Amount</td><td style="padding:8px 0;color:#ef4444;font-weight:600;">R${data.disputeAmount.toFixed(2)}</td></tr>
          </table>
          <div style="margin-top:32px;">
            <a href="${APP_URL}/admin/fraud" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Review Fraud Events →</a>
          </div>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendChargebackNotificationEmail failed:", err);
  }
}

// ─── Contact form: send to admin + confirmation to submitter ─────────────────
export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    // Notify admin
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[Contact Form] ${data.subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <h2 style="color:#fff;margin:0 0 8px;">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#888;width:100px;">From</td><td style="padding:8px 0;color:#fff;">${data.name} &lt;${data.email}&gt;</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Subject</td><td style="padding:8px 0;color:#fff;">${data.subject}</td></tr>
          </table>
          <div style="margin-top:16px;background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #7c3aed;">
            <p style="color:#e0e0e0;margin:0;white-space:pre-wrap;">${data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")}</p>
          </div>
        </div>
      `,
    });

    // Send confirmation to submitter
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: "We received your message — Slip a Tip",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#fff;margin:0 0 8px;">Thanks for reaching out, ${data.name}!</h2>
          <p style="color:#888;margin:0 0 24px;">We've received your message and will get back to you within 1–2 business days.</p>
          <div style="background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #7c3aed;">
            <p style="color:#888;font-size:12px;margin:0 0 8px;">Your message:</p>
            <p style="color:#e0e0e0;margin:0;font-size:13px;">${data.message}</p>
          </div>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendContactEmail failed:", err);
  }
}

// ─── Worker notification: balance forfeiture warning ───────────────────────────
export async function sendForfeitureWarningEmail(worker: {
  firstName: string;
  email: string;
  balance: number;
  daysUntilForfeiture: number;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to: worker.email,
      subject: `⚠️ Your Slip a Tip balance will be forfeited in ${worker.daysUntilForfeiture} days`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e0e0e0;padding:32px;border-radius:12px;">
          <img src="${APP_URL}/logo.png" alt="Slip a Tip" style="height:40px;margin-bottom:24px;" />
          <h2 style="color:#f59e0b;margin:0 0 8px;">⚠️ Action Required: Balance Forfeiture Warning</h2>
          <p style="color:#888;margin:0 0 24px;">Hi ${worker.firstName}, your Slip a Tip wallet has been inactive for a while.</p>
          <div style="background:#1a1a2e;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin-bottom:24px;">
            <p style="color:#f59e0b;font-size:18px;font-weight:600;margin:0 0 8px;">R${worker.balance.toFixed(2)} will be forfeited in ${worker.daysUntilForfeiture} days</p>
            <p style="color:#888;margin:0;font-size:13px;">Under our Terms of Service, balances are forfeited after 180 days of inactivity.</p>
          </div>
          <p style="color:#e0e0e0;margin:0 0 24px;">To prevent forfeiture, log in to your account and make a withdrawal or any activity.</p>
          <div style="margin-bottom:32px;">
            <a href="${APP_URL}/auth/login" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Log In to Withdraw →</a>
          </div>
          <p style="color:#555;font-size:12px;margin-top:32px;">Slip a Tip · slipatip.co.za</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("sendForfeitureWarningEmail failed:", err);
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

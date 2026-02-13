import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    const CONTACT_EMAIL = "cameronfalck03@gmail.com";

    // Log for server-side tracking
    console.log("=== CONTACT FORM SUBMISSION ===");
    console.log(`From: ${data.name} <${data.email}>`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Message: ${data.message}`);
    console.log(`To: ${CONTACT_EMAIL}`);
    console.log("================================");

    // Build mailto-compatible response for client-side fallback
    // In production, integrate with an email service (SendGrid, Resend, etc.)
    return NextResponse.json({
      success: true,
      message: "Your message has been received. We will get back to you soon.",
      mailto: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[Slip Contact] ${data.subject}`)}&body=${encodeURIComponent(`From: ${data.name} (${data.email})\n\n${data.message}`)}`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { uploadDocument, getMimeType } from "@/lib/storage";

export async function GET() {
  try {
    const session = await requireAuth(["WORKER"]);
    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      select: {
        docIdUrl: true,
        docAddressUrl: true,
        docSelfieUrl: true,
        docStatus: true,
        docRejectReason: true,
        docSubmittedAt: true,
        docReviewedAt: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ documents: worker });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get documents error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      select: { id: true, docStatus: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (worker.docStatus === "APPROVED") {
      return NextResponse.json({ error: "Documents already approved" }, { status: 400 });
    }

    const formData = await request.formData();
    const idDoc = formData.get("idDocument") as File | null;
    const addressDoc = formData.get("addressDocument") as File | null;
    const selfieDoc = formData.get("selfie") as File | null;

    if (!idDoc || !addressDoc || !selfieDoc) {
      return NextResponse.json(
        { error: "All three documents are required: ID, proof of address, and selfie" },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024;
    const allowedExts = ["jpg", "jpeg", "png", "pdf", "webp", "heic"];
    for (const [name, file] of [["ID", idDoc], ["Address", addressDoc], ["Selfie", selfieDoc]] as [string, File][]) {
      if (file.size > maxSize) {
        return NextResponse.json({ error: `${name} file is too large. Maximum 10MB.` }, { status: 400 });
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!allowedExts.includes(ext || "")) {
        return NextResponse.json(
          { error: `${name} file type not supported. Use JPG, PNG, PDF, or WEBP.` },
          { status: 400 }
        );
      }
    }

    // Upload to Cloudflare R2 (private — never publicly accessible)
    async function uploadToR2(file: File, prefix: string): Promise<string> {
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = getMimeType(file.name);
      const { key } = await uploadDocument(worker!.id, prefix, buffer, file.name, contentType);
      return key;
    }

    const docIdUrl = await uploadToR2(idDoc, "id");
    const docAddressUrl = await uploadToR2(addressDoc, "address");
    const docSelfieUrl = await uploadToR2(selfieDoc, "selfie");

    await db.worker.update({
      where: { id: worker.id },
      data: {
        docIdUrl,
        docAddressUrl,
        docSelfieUrl,
        docStatus: "PENDING_REVIEW",
        docSubmittedAt: new Date(),
        docRejectReason: null,
      },
    });

    return NextResponse.json({ success: true, status: "PENDING_REVIEW" });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Upload documents error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

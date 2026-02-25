import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
    for (const [name, file] of [["ID", idDoc], ["Address", addressDoc], ["Selfie", selfieDoc]] as [string, File][]) {
      if (file.size > maxSize) {
        return NextResponse.json({ error: `${name} file is too large. Maximum 10MB.` }, { status: 400 });
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "pdf", "webp", "heic"].includes(ext || "")) {
        return NextResponse.json(
          { error: `${name} file type not supported. Use JPG, PNG, PDF, or WEBP.` },
          { status: 400 }
        );
      }
    }

    // Save files to /public/uploads/documents/{workerId}/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents", worker.id);
    await mkdir(uploadDir, { recursive: true });

    async function saveFile(file: File, prefix: string): Promise<string> {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${prefix}-${randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      return `/uploads/documents/${worker!.id}/${filename}`;
    }

    const docIdUrl = await saveFile(idDoc, "id");
    const docAddressUrl = await saveFile(addressDoc, "address");
    const docSelfieUrl = await saveFile(selfieDoc, "selfie");

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

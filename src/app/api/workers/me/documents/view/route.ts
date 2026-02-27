import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getSignedDocumentUrl } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(["WORKER"]);
    const { searchParams } = new URL(request.url);
    const doc = searchParams.get("doc"); // "id" | "address" | "selfie"

    if (!doc || !["id", "address", "selfie"].includes(doc)) {
      return NextResponse.json(
        { error: "doc parameter must be one of: id, address, selfie" },
        { status: 400 }
      );
    }

    const worker = await db.worker.findUnique({
      where: { userId: session.user.id },
      select: { docIdUrl: true, docAddressUrl: true, docSelfieUrl: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const keyMap: Record<string, string | null> = {
      id: worker.docIdUrl,
      address: worker.docAddressUrl,
      selfie: worker.docSelfieUrl,
    };

    const key = keyMap[doc];
    if (!key) {
      return NextResponse.json({ error: "Document not uploaded yet" }, { status: 404 });
    }

    const url = await getSignedDocumentUrl(key, 900);
    return NextResponse.json({ url, expiresIn: 900 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Document view error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

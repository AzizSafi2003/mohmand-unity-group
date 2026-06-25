import { NextRequest, NextResponse } from "next/server";
import { buildMemberReportPdf, type MemberReportPayload } from "@/lib/pdf/memberReport";

// jsPDF needs the Node runtime (no DOM / edge limitations).
export const runtime = "nodejs";

/**
 * POST /api/reports/pdf
 * Body: MemberReportPayload (assembled client-side from Convex queries).
 * Returns: application/pdf bytes for download.
 *
 * Note: this route intentionally receives the already-resolved data rather
 * than querying Convex itself — that keeps it free of server-side auth wiring
 * while the authoritative RBAC happens in the Convex queries that produced the
 * data. See PROJECT_AUDIT_REPORT.md for the rationale and a hardening note.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MemberReportPayload;
    if (!payload?.member || !payload?.summary || !Array.isArray(payload?.rows)) {
      return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
    }

    const pdf = buildMemberReportPdf(payload);
    const filename = `${(payload.member.name || "member").replace(/[^a-z0-9]+/gi, "-")}-${payload.year}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { buildMemberReportPdf, type MemberReportPayload } from "@/lib/pdf/memberReport";

export const runtime = "nodejs";

interface EmailReportBody extends MemberReportPayload {
  to: string;
}

/**
 * POST /api/email/report
 * Body: MemberReportPayload + { to }.
 *
 * Provider-agnostic: reads EMAIL_PROVIDER from the environment. The Resend
 * adapter below is fully wired (REST API, no SDK dependency). If no provider /
 * key is configured the route returns a clear, non-error message so the rest
 * of the app keeps working in local dev. Swap in SendGrid/SES by adding a
 * branch with the same shape.
 */
export async function POST(req: NextRequest) {
  let body: EmailReportBody;
  try {
    body = (await req.json()) as EmailReportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.to)) {
    return NextResponse.json({ error: "A valid recipient email is required" }, { status: 400 });
  }
  if (!body?.member || !body?.summary || !Array.isArray(body?.rows)) {
    return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
  }

  const provider = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  const from = process.env.EMAIL_FROM ?? "no-reply@mohmandunity.org";

  // Generate the PDF attachment regardless of provider.
  const pdf = buildMemberReportPdf(body);
  const base64 = pdf.toString("base64");
  const filename = `${(body.member.name || "member").replace(/[^a-z0-9]+/gi, "-")}-${body.year}.pdf`;
  const subject = `${body.organization} — Contribution report (${body.year})`;
  const text = `Dear ${body.member.name},\n\nPlease find attached your contribution report for solar year ${body.year}.\n\nTotal required: ${body.summary.totalRequired}\nTotal paid: ${body.summary.totalPaid}\nRemaining: ${body.summary.remaining}\n\n— ${body.organization}`;

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "EMAIL_PROVIDER=resend but RESEND_API_KEY is missing" },
        { status: 500 }
      );
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [body.to],
          subject,
          text,
          attachments: [{ filename, content: base64 }],
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return NextResponse.json({ error: `Resend error: ${detail}` }, { status: 502 });
      }
      const json = await res.json();
      return NextResponse.json({ message: `Report emailed to ${body.to}`, id: json.id });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Email send failed" },
        { status: 502 }
      );
    }
  }

  // No provider configured — succeed gracefully so dev flows aren't blocked.
  return NextResponse.json({
    message:
      "Email provider not configured. Set EMAIL_PROVIDER=resend and RESEND_API_KEY to send. The PDF was generated successfully.",
    previewBytes: pdf.length,
  });
}

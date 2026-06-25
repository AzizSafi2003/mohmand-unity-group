import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatAmount } from "@/lib/financial";

/** Payload shape POSTed by the reports page. Kept framework-agnostic. */
export interface MemberReportPayload {
  year: number;
  organization: string;
  member: {
    name: string;
    maritalStatus: string;
    gender: string;
    phone?: string;
    occupation?: string;
  };
  summary: {
    totalRequired: number;
    totalPaid: number;
    remaining: number;
    paidMonths: number;
    partialMonths: number;
    unpaidMonths: number;
  };
  rows: Array<{ month: string; amountDue: number; amountPaid: number; status: string }>;
  currency?: string;
  generatedBy?: string;
}

const PINE: [number, number, number] = [30, 77, 59];
const BRASS: [number, number, number] = [184, 137, 59];
const INK: [number, number, number] = [58, 53, 43];

/**
 * Build a one-page member contribution report. Returns the PDF as a Buffer so
 * it can be streamed by the download route or attached by the email route.
 *
 * Drawn by hand (logo mark + header band + summary + autotable) rather than
 * from an HTML template so it works identically in a Node route with no DOM.
 */
export function buildMemberReportPdf(payload: MemberReportPayload): Buffer {
  const currency = payload.currency ?? "AFN";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Header band.
  doc.setFillColor(...PINE);
  doc.rect(0, 0, pageW, 90, "F");

  // Logo mark — a brass diamond with a small tree, echoing the web logo.
  doc.setFillColor(...BRASS);
  doc.triangle(margin + 16, 30, margin + 30, 45, margin + 16, 60, "F");
  doc.triangle(margin + 16, 30, margin + 2, 45, margin + 16, 60, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.4);
  doc.line(margin + 16, 38, margin + 16, 56);
  doc.line(margin + 16, 46, margin + 10, 42);
  doc.line(margin + 16, 46, margin + 22, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(payload.organization, margin + 44, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Member Contribution Report · Solar Year ${payload.year}`, margin + 44, 60);

  // Member info block.
  let y = 120;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(payload.member.name || "—", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 101, 87);
  const meta = [
    `Marital status: ${payload.member.maritalStatus}`,
    `Gender: ${payload.member.gender}`,
    payload.member.phone ? `Phone: ${payload.member.phone}` : "",
    payload.member.occupation ? `Occupation: ${payload.member.occupation}` : "",
  ].filter(Boolean);
  y += 16;
  doc.text(meta.join("    "), margin, y);

  // Summary row.
  y += 26;
  const summaryCells: Array<[string, string]> = [
    ["Total required", formatAmount(payload.summary.totalRequired, { symbol: currency })],
    ["Total paid", formatAmount(payload.summary.totalPaid, { symbol: currency })],
    ["Remaining", formatAmount(payload.summary.remaining, { symbol: currency })],
    [
      "Compliance",
      `${
        payload.summary.totalRequired > 0
          ? Math.round((payload.summary.totalPaid / payload.summary.totalRequired) * 100)
          : 0
      }%`,
    ],
  ];
  const cardW = (pageW - margin * 2 - 18) / 4;
  summaryCells.forEach(([label, value], i) => {
    const x = margin + i * (cardW + 6);
    doc.setFillColor(245, 243, 234);
    doc.roundedRect(x, y, cardW, 48, 6, 6, "F");
    doc.setTextColor(120, 111, 96);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x + 10, y + 18);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 10, y + 36);
    doc.setFont("helvetica", "normal");
  });

  // Monthly table.
  autoTable(doc, {
    startY: y + 66,
    head: [["Month", "Amount due", "Amount paid", "Status"]],
    body: payload.rows.map((r) => [
      r.month,
      formatAmount(r.amountDue, { symbol: currency }),
      formatAmount(r.amountPaid, { symbol: currency }),
      r.status,
    ]),
    theme: "grid",
    headStyles: { fillColor: PINE, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 249, 244] },
    styles: { fontSize: 9, cellPadding: 6, textColor: INK },
    margin: { left: margin, right: margin },
  });

  // Footer with date, generated-by, and page numbers.
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(228, 224, 210);
    doc.line(margin, h - 40, pageW - margin, h - 40);
    doc.setFontSize(8);
    doc.setTextColor(140, 132, 117);
    const generated = `Generated ${new Date().toLocaleString("en-US")}${
      payload.generatedBy ? ` by ${payload.generatedBy}` : ""
    }`;
    doc.text(generated, margin, h - 26);
    doc.text(`Page ${p} of ${pageCount}`, pageW - margin, h - 26, { align: "right" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { requireUser } from "@/lib/supabase/server";
export const runtime = "nodejs";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      { supabase } = await requireUser();
    const { data: c, error } = await supabase
      .from("certificates")
      .select(
        "*,project:projects(id,title),issuer:profiles!issued_by(id,name),receiver:profiles!receiver_id(id,name)",
      )
      .eq("id", id)
      .single();
    if (error || !c)
      return new Response("Certificate not found", { status: 404 });
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com"}/verify/${c.verification_code}`,
      qr = await QRCode.toBuffer(verifyUrl, {
        width: 150,
        margin: 1,
        color: { dark: "#0a0f1e", light: "#ffffff" },
      });
    const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 50,
        info: {
          Title: `IBF Certificate — ${c.receiver.name}`,
          Author: "Innovator Bridge Foundry",
        },
      }),
      chunks: Buffer[] = [];
    doc.on("data", (x) => chunks.push(x));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
    doc.rect(0, 0, 842, 595).fill("#0a0f1e");
    doc.lineWidth(3).strokeColor("#00f5d4").rect(25, 25, 792, 545).stroke();
    doc
      .fillColor("#00f5d4")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("✦  IBF", 50, 50);
    doc
      .fillColor("#f4f7fb")
      .fontSize(32)
      .text("Certificate of Contribution", 50, 120, { align: "center" });
    doc
      .fillColor("#94a3b8")
      .font("Helvetica")
      .fontSize(14)
      .text("This verified certificate is proudly presented to", 50, 175, {
        align: "center",
      });
    doc
      .fillColor("#00f5d4")
      .font("Helvetica-Bold")
      .fontSize(36)
      .text(c.receiver.name, 50, 205, { align: "center" });
    doc
      .fillColor("#f4f7fb")
      .font("Helvetica")
      .fontSize(16)
      .text(`for contributing as ${c.role_title} to`, 50, 260, {
        align: "center",
      });
    doc
      .font("Helvetica-Bold")
      .fontSize(23)
      .text(c.project.title, 50, 290, { align: "center" });
    const duration =
      c.started_at || c.completed_at
        ? `${c.started_at || "—"}  to  ${c.completed_at || "Present"}`
        : "";
    if (duration)
      doc
        .fillColor("#94a3b8")
        .font("Helvetica")
        .fontSize(12)
        .text(duration, 50, 330, { align: "center" });
    doc
      .fillColor("#f4f7fb")
      .fontSize(13)
      .text(`Issued by ${c.issuer.name}`, 80, 430);
    doc
      .moveTo(80, 425)
      .lineTo(270, 425)
      .strokeColor("#64748b")
      .lineWidth(1)
      .stroke();
    doc.image(qr, 650, 380, { width: 110 });
    doc
      .fillColor("#94a3b8")
      .fontSize(8)
      .text(`Verification: ${c.verification_code}`, 520, 500, {
        width: 250,
        align: "right",
      });
    doc.text(verifyUrl, 520, 515, { width: 250, align: "right" });
    doc.end();
    const pdf = await done;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="ibf-certificate-${c.verification_code}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (e: any) {
    return new Response(
      e.message === "UNAUTHORIZED" ? "Unauthorized" : "PDF generation failed",
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

import { toast } from "sonner";
import type { Company, Customer, Invoice } from "./types";
import { formatDate, formatGNF, invoiceTotals } from "./format";

/**
 * Builds a clean, standalone HTML string for an invoice or credit note.
 * Uses standard CSS (hex/rgb colors, inline fonts) compatible with both browser print and html2pdf.
 */
export function buildInvoiceHtml(invoice: Invoice, company: Company, customer?: Customer): string {
  const totals = invoiceTotals(invoice);
  const isAvoir = invoice.document_type === "avoir";
  const docTitle = isAvoir ? "NOTE D'AVOIR" : "FACTURE";

  const linesHtml = invoice.lines
    .map(
      (line, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
      <td style="padding: 10px; font-weight: 500; color: #0f172a;">${line.description}</td>
      <td style="padding: 10px; text-align: center; font-weight: 600;">${line.quantity}</td>
      <td style="padding: 10px; text-align: right; font-family: monospace;">${formatGNF(line.unit_price)}</td>
      <td style="padding: 10px; text-align: center; font-family: monospace;">${(line.vat_rate * 100).toFixed(0)}%</td>
      <td style="padding: 10px; text-align: right; font-weight: 600; font-family: monospace;">${formatGNF(line.quantity * line.unit_price)}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${docTitle} ${invoice.reference}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: #ffffff; padding: 30px; font-size: 13px; line-height: 1.5; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; }
        .header-table { width: 100%; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
        .company-name { font-size: 20px; font-weight: 700; color: #2f4858; }
        .company-sub { font-size: 11px; color: #64748b; }
        .company-details { font-size: 11px; color: #475569; margin-top: 6px; }
        .doc-badge { display: inline-block; padding: 4px 12px; background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
        .doc-ref { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; font-family: monospace; }
        .meta-dates { font-size: 11px; color: #64748b; margin-top: 4px; }
        .billing-grid { width: 100%; margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; }
        .billing-cell { width: 50%; vertical-align: top; font-size: 12px; }
        .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #2f4858; letter-spacing: 0.5px; margin-bottom: 6px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; font-size: 12px; }
        .items-table th { background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px; font-weight: 700; text-align: left; }
        .totals-table { width: 100%; margin-bottom: 25px; }
        .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px; color: #475569; }
        .totals-box { width: 260px; margin-left: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 12px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; color: #475569; }
        .total-grand { display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #cbd5e1; font-weight: 700; font-size: 14px; color: #2f4858; }
        .footer-stamp { border-top: 2px dashed #e2e8f0; padding-top: 20px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
        .stamp-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px 14px; color: #065f46; display: flex; align-items: center; gap: 10px; }
        @media print {
          body { padding: 0; background: #ffffff; }
          .invoice-box { border: none; padding: 0; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table class="header-table">
          <tr>
            <td style="vertical-align: top;">
              <div class="company-name">${company.name}</div>
              <div class="company-sub">Facturation & Services Électroniques</div>
              <div class="company-details">
                <strong>NIF :</strong> ${company.nif} | <strong>RCCM :</strong> ${company.rccm}<br/>
                <strong>Adresse :</strong> ${company.address}, ${company.city}<br/>
                <strong>Tél :</strong> ${company.phone} | <strong>Email :</strong> ${company.email}
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div class="doc-badge">${docTitle}</div>
              <div class="doc-ref">${invoice.reference}</div>
              <div class="meta-dates">Date d'émission : <strong>${formatDate(invoice.issue_date)}</strong></div>
              <div class="meta-dates">Date d'échéance : <strong>${formatDate(invoice.due_date)}</strong></div>
            </td>
          </tr>
        </table>

        <table class="billing-grid">
          <tr>
            <td class="billing-cell">
              <div class="section-label">Émetteur / Vendeur</div>
              <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${company.name}</div>
              <div>${company.address}, ${company.city}</div>
              <div>NIF : ${company.nif} | RCCM : ${company.rccm}</div>
            </td>
            <td class="billing-cell">
              <div class="section-label">Facturé à / Client</div>
              <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${customer?.name || "Client Inconnu"}</div>
              ${customer?.nifp ? `<div><strong>NIFp :</strong> ${customer.nifp}</div>` : ""}
              ${customer?.contact_name ? `<div>Contact : ${customer.contact_name}</div>` : ""}
              ${customer?.phone ? `<div>Tél : ${customer.phone}</div>` : ""}
              ${customer?.email ? `<div>Email : ${customer.email}</div>` : ""}
              ${customer?.address ? `<div>Adresse : ${customer.address}, ${customer.city}</div>` : ""}
            </td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Désignation des biens / services</th>
              <th style="width: 60px; text-align: center;">Qté</th>
              <th style="width: 130px; text-align: right;">P.U HT (GNF)</th>
              <th style="width: 60px; text-align: center;">TVA</th>
              <th style="width: 140px; text-align: right;">Total HT (GNF)</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td style="vertical-align: top;">
              ${
                company.bank_name
                  ? `
                <div class="bank-box">
                  <div class="section-label" style="margin-bottom: 4px;">Coordonnées Bancaires (RIB)</div>
                  <div><strong>Banque :</strong> ${company.bank_name}</div>
                  <div><strong>Compte / RIB :</strong> <span style="font-family: monospace;">${company.bank_account}</span></div>
                </div>
              `
                  : ""
              }
              <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 8px;">
                Arrêté la présente facture à la somme TTC enregistrée auprès du système d'information de l'administration fiscale (eTVA DGI).
              </div>
            </td>
            <td style="width: 280px; vertical-align: top;">
              <div class="totals-box">
                <div class="total-row"><span>Total HT :</span><span style="font-family: monospace;">${formatGNF(totals.ht)}</span></div>
                <div class="total-row"><span>TVA (18%) :</span><span style="font-family: monospace;">${formatGNF(totals.vat)}</span></div>
                <div class="total-grand"><span>Total TTC (GNF) :</span><span style="font-family: monospace; color: #2f4858;">${formatGNF(totals.ttc)}</span></div>
              </div>
            </td>
          </tr>
        </table>

        <div class="footer-stamp">
          <div class="stamp-box">
            <div>
              <div style="font-weight: 700; text-transform: uppercase; font-size: 11px;">Certification eTVA DGI Guinée</div>
              <div style="font-family: monospace; font-size: 11px; margin: 2px 0;">${invoice.etva_reference || `DGI-SIMULATED-${invoice.reference}`}</div>
              <div style="font-size: 9px; opacity: 0.8;">Conforme à la loi de finances - République de Guinée</div>
            </div>
          </div>
          <div style="text-align: right; color: #64748b; font-size: 10px;">
            <div style="font-weight: 600; color: #334155;">La Direction Générale de l'Entreprise</div>
            <div style="margin-top: 25px; font-family: monospace;">[ Timbre et Signature Électronique ]</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Triggers clean print pop-up window containing only the document.
 */
export function printInvoiceDocument(invoice: Invoice, company: Company, customer?: Customer) {
  const htmlContent = buildInvoiceHtml(invoice, company, customer);
  const printWindow = window.open("", "_blank", "width=900,height=800");

  if (!printWindow) {
    toast.error("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Automatically close popup window after printing
    setTimeout(() => {
      try {
        printWindow.close();
      } catch {
        // ignore
      }
    }, 1000);
  };
}

// @ts-ignore
import html2canvas from "html2canvas";
// @ts-ignore
import { jsPDF } from "jspdf";

/**
 * Downloads a clean PDF using direct html2canvas + jsPDF rendering from the generated standalone HTML element.
 */
export async function downloadInvoicePdfDocument(
  invoice: Invoice,
  company: Company,
  customer?: Customer,
): Promise<boolean> {
  const filename = `${invoice.document_type === "avoir" ? "Avoir" : "Facture"}_${invoice.reference}.pdf`;
  const toastId = toast.loading(`Génération du fichier PDF ${filename}...`);

  try {
    const htmlContent = buildInvoiceHtml(invoice, company, customer);

    // Create an isolated iframe to prevent main app Tailwind v4 oklch CSS inheritance
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "0";
    iframe.style.top = "0";
    iframe.style.width = "794px";
    iframe.style.height = "1123px";
    iframe.style.zIndex = "-99999";
    iframe.style.opacity = "0.01";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      throw new Error("Impossible de créer le contexte d'impression isolé.");
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Small delay to ensure iframe resources (fonts/images) are layout rendered
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Render iframe body to canvas using html2canvas
    const canvas = await html2canvas(doc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);

    toast.dismiss(toastId);
    toast.success(`Le fichier ${filename} a été téléchargé avec succès !`);
    return true;
  } catch (err: any) {
    console.error("Erreur génération PDF:", err);
    toast.dismiss(toastId);
    toast.error(`Échec du téléchargement PDF : ${err?.message || "Erreur de rendu"}`);
    return false;
  }
}

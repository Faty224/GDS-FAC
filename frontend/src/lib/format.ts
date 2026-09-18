import type { Invoice, InvoiceLine, Totals } from "./types";

export function formatGNF(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value))} GNF`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Calculs d'affichage uniquement.
 * Les montants définitifs sont recalculés et validés côté backend Django.
 */
export function lineHT(line: InvoiceLine): number {
  return line.quantity * line.unit_price;
}

export function lineVAT(line: InvoiceLine): number {
  return lineHT(line) * (line.vat_rate / 100);
}

export function lineTTC(line: InvoiceLine): number {
  return lineHT(line) + lineVAT(line);
}

export function computeTotals(lines: InvoiceLine[]): Totals {
  const ht = lines.reduce((sum, l) => sum + lineHT(l), 0);
  const vat = lines.reduce((sum, l) => sum + lineVAT(l), 0);
  return { ht, vat, ttc: ht + vat };
}

export function invoiceTotals(invoice: Invoice): Totals {
  const lines = invoice?.lines || [];
  if (!Array.isArray(lines) || lines.length === 0) {
    const rawInv = invoice as any;
    const ht = Number(rawInv?.total_ht ?? invoice?.total_ht ?? 0);
    const vat = Number(rawInv?.total_tva ?? invoice?.total_tva ?? 0);
    const ttc = Number(rawInv?.total_ttc ?? invoice?.total_ttc ?? (ht + vat));
    return { ht, vat, ttc };
  }
  return computeTotals(lines);
}

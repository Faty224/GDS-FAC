import { cn } from "@/lib/utils";
import type { EtvaStatus, InvoiceStatus } from "@/lib/types";

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  validee: { label: "Validée", className: "bg-accent text-accent-foreground border-accent" },
  en_transmission: {
    label: "En transmission",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  transmise: { label: "Transmise", className: "bg-info/10 text-info border-info/25" },
  acceptee: { label: "Acceptée", className: "bg-success/10 text-success border-success/25" },
  rejetee: {
    label: "Rejetée",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
  erreur: {
    label: "Erreur",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
};

const ETVA_STATUS: Record<EtvaStatus, { label: string; className: string }> = {
  non_transmis: {
    label: "Non transmise",
    className: "bg-muted text-muted-foreground border-border",
  },
  en_cours: {
    label: "En cours",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  accepte: { label: "Acceptée", className: "bg-success/10 text-success border-success/25" },
  rejete: {
    label: "Rejetée",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
  erreur: {
    label: "Erreur",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
};

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Pill {...INVOICE_STATUS[status]} />;
}

export function EtvaStatusBadge({ status }: { status: EtvaStatus }) {
  return <Pill {...ETVA_STATUS[status]} />;
}

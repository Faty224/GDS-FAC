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

export function PaymentStatusBadge({
  status = "non_payee",
  dueDate,
}: {
  status?: "non_payee" | "partiellement_payee" | "payee";
  dueDate?: string;
}) {
  if (status === "payee") {
    return <Pill label="Payée" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" />;
  }

  if (status === "partiellement_payee") {
    return <Pill label="Partielle" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300" />;
  }

  // Check overdue
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  if (isOverdue) {
    return <Pill label="En retard" className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 font-semibold" />;
  }

  return <Pill label="Non payée" className="bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300" />;
}

/** Types métier GDS Facture — alignés sur les modèles Django REST Framework cibles. */

export type Role = "admin" | "facturier" | "consultation";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  company_id: string;
  is_active: boolean;
}

export interface Company {
  id: string;
  name: string;
  legal_form: string;
  nif: string;
  rccm: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  tax_regime: string;
  bank_name: string;
  bank_account: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  nifp: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  is_active: boolean;
  created_at: string;
}

export type ProductKind = "produit" | "service";

export interface Product {
  id: string;
  company_id: string;
  reference: string;
  label: string;
  kind: ProductKind;
  unit_price: number;
  vat_rate: number;
  unit: string;
  is_active: boolean;
}

export interface BillingSetting {
  id: string;
  company_id: string;
  reference: string;
  label: string;
  legal_mentions: string;
  payment_instructions: string;
  is_active: boolean;
}

export type InvoiceStatus =
  "brouillon" | "validee" | "en_transmission" | "transmise" | "acceptee" | "rejetee" | "erreur";

export type EtvaStatus = "non_transmis" | "en_cours" | "accepte" | "rejete" | "erreur";

export interface InvoiceLine {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export interface HistoryEntry {
  id: string;
  label: string;
  at: string;
  user: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  document_type: "facture" | "avoir";
  parent_invoice_id: string | null;
  reference: string;
  internal_reference: string;
  customer_id: string;
  billing_setting_id: string;
  issue_date: string;
  due_date: string;
  execution_note: string;
  lines: InvoiceLine[];
  status: InvoiceStatus;
  etva_status: EtvaStatus;
  etva_reference: string | null;
  etva_message: string | null;
  created_at: string;
  history: HistoryEntry[];
}

export interface EtvaTransmission {
  id: string;
  invoice_id: string;
  invoice_reference: string;
  document_type: "facture" | "avoir";
  sent_at: string;
  status: "accepte" | "rejete" | "erreur";
  dgi_reference: string | null;
  message: string;
  http_status: number;
  duration_ms: number;
  operation: string;
  mode: "simulation";
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  at: string;
  result: "succes" | "echec";
}

export interface Totals {
  ht: number;
  vat: number;
  ttc: number;
}

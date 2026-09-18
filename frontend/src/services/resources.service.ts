import { api } from "./api";
import type {
  AuditEntry,
  BillingSetting,
  Company,
  Customer,
  Invoice,
  Product,
  User,
} from "@/lib/types";

/**
 * Services REST — un endpoint par application Django REST Framework.
 * Aligné à 100% avec les routes d'API Django backend.
 */

function crud<T extends { id: string | number }>(basePath: string) {
  const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return {
    list: async (params?: Record<string, unknown>) => (await api.get<T[]>(base, { params })).data,
    retrieve: async (id: string | number) => (await api.get<T>(`${base}${id}/`)).data,
    create: async (payload: Partial<T>) => (await api.post<T>(base, payload)).data,
    update: async (id: string | number, payload: Partial<T>) =>
      (await api.patch<T>(`${base}${id}/`, payload)).data,
    remove: async (id: string | number) => {
      await api.delete(`${base}${id}/`);
    },
  };
}

import type { InvoiceLine } from "@/lib/types";

export function normalizeCustomer(raw: any): Customer {
  if (!raw) return { id: "", company_id: "", name: "", nifp: "", contact_name: "", phone: "", email: "", address: "", city: "", is_active: true, created_at: "" };
  return {
    id: String(raw.id || ""),
    company_id: String(raw.company || raw.company_id || "1"),
    name: raw.name || raw.nom || "",
    nifp: raw.nifp || raw.nif || "",
    contact_name: raw.contact_name || "",
    phone: raw.phone || raw.telephone || "",
    email: raw.email || "",
    address: raw.address || raw.adresse || "",
    city: raw.city || raw.ville || "",
    is_active: raw.status === "ACTIF" || raw.is_active === true,
    created_at: raw.created_at || "",
  };
}

export function normalizeInvoice(raw: any): Invoice {
  if (!raw) {
    return {
      id: "",
      company_id: "",
      document_type: "facture",
      parent_invoice_id: null,
      reference: "",
      internal_reference: "",
      customer_id: "",
      billing_setting_id: "",
      issue_date: "",
      due_date: "",
      execution_note: "",
      lines: [],
      status: "brouillon",
      etva_status: "non_transmis",
      etva_reference: null,
      etva_message: null,
      created_at: "",
      history: [],
    };
  }

  const itemsRaw = raw.items || raw.lines || [];
  const lines: InvoiceLine[] = itemsRaw.map((item: any, idx: number) => ({
    id: String(item.id || item.product_id || idx + 1),
    product_id: item.product ? String(item.product) : item.product_id ? String(item.product_id) : null,
    description: item.designation || item.description || item.label || "",
    quantity: Number(item.quantity || 0),
    unit_price: Number(item.unit_price || 0),
    vat_rate: Number(item.vat_rate || 0),
  }));

  const rawStatus = (raw.status || "brouillon").toString().toLowerCase();
  const normalizedStatus: Invoice["status"] =
    rawStatus.includes("valide") || rawStatus === "validated"
      ? "validee"
      : rawStatus.includes("accept")
      ? "acceptee"
      : rawStatus.includes("rejet")
      ? "rejetee"
      : rawStatus.includes("envoi") || rawStatus.includes("transmit")
      ? "en_transmission"
      : rawStatus.includes("erreur")
      ? "erreur"
      : "brouillon";

  const rawEtvaStatus = (raw.etva_status || "non_transmis").toString().toLowerCase();
  const normalizedEtvaStatus: Invoice["etva_status"] =
    rawEtvaStatus.includes("accept")
      ? "accepte"
      : rawEtvaStatus.includes("rejet")
      ? "rejete"
      : rawEtvaStatus.includes("cours") || rawEtvaStatus.includes("transmit")
      ? "en_cours"
      : rawEtvaStatus.includes("erreur")
      ? "erreur"
      : "non_transmis";

  const customerId = String(
    raw.customer_id ||
      raw.customer ||
      (typeof raw.customer_detail === "object" ? raw.customer_detail?.id : "") ||
      ""
  );

  const ref = raw.reference || raw.number || `FACT-${raw.id || "000"}`;

  return {
    id: String(raw.id || ""),
    company_id: String(raw.company || raw.company_id || "1"),
    document_type: raw.document_type || "facture",
    parent_invoice_id: raw.parent_invoice_id ? String(raw.parent_invoice_id) : null,
    reference: ref,
    internal_reference: raw.internal_reference || "",
    customer_id: customerId,
    billing_setting_id: String(raw.billing_setting || raw.billing_setting_id || ""),
    issue_date: raw.issue_date || raw.date || new Date().toISOString().split("T")[0],
    due_date: raw.due_date || raw.date || "",
    execution_note: raw.execution_note || "",
    lines,
    status: normalizedStatus,
    etva_status: normalizedEtvaStatus,
    etva_reference: raw.etva_reference || null,
    etva_message: raw.etva_message || null,
    payment_status: raw.payment_status || "non_payee",
    paid_amount: Number(raw.paid_amount || 0),
    total_ht: Number(raw.total_ht || 0),
    total_tva: Number(raw.total_tva || 0),
    total_ttc: Number(raw.total_ttc || 0),
    created_at: raw.created_at || new Date().toISOString(),
    history: raw.history || [],
  };
}

export const customersService = {
  ...crud<Customer>("customers"),
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any[]>("/customers/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list.map(normalizeCustomer);
  },
};

export function normalizeProduct(raw: any): Product {
  if (!raw) return { id: "", company_id: "", reference: "", label: "", kind: "produit", unit_price: 0, vat_rate: 18, unit: "unité", is_active: true };
  return {
    id: String(raw.id || ""),
    company_id: String(raw.company || raw.company_id || "1"),
    reference: raw.reference || "",
    label: raw.label || raw.designation || "",
    kind: raw.kind || (raw.category === "SERVICE" ? "service" : "produit"),
    unit_price: Number(raw.unit_price || 0),
    vat_rate: Number(raw.vat_rate || 18),
    unit: raw.unit || "unité",
    is_active: raw.status === "ACTIF" || raw.is_active === true,
  };
}

export const productsService = {
  ...crud<Product>("products"),
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any[]>("/products/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list.map(normalizeProduct);
  },
};
export const billingSettingsService = {
  ...crud<BillingSetting>("billing/list"),
  active: async () => (await api.get<BillingSetting>("/billing/active/")).data,
};

export const invoicesService = {
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any[]>("/invoices/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list.map(normalizeInvoice);
  },
  retrieve: async (id: string | number) => {
    const res = await api.get<any>(`/invoices/${id}/`);
    return normalizeInvoice(res.data);
  },
  create: async (payload: Partial<Invoice>) => {
    const custId = payload.customer_id || (payload as any).customer;
    const parsedCustId = !isNaN(Number(custId)) ? Number(custId) : custId;

    const djangoItems = (payload.lines || (payload as any).items || []).map((line: any) => ({
      product: line.product_id ? (!isNaN(Number(line.product_id)) ? Number(line.product_id) : line.product_id) : null,
      designation: line.description || line.designation || "",
      quantity: Number(line.quantity || 1),
      unit_price: Number(line.unit_price || 0),
      vat_rate: Number(line.vat_rate || 0),
    }));

    const djangoPayload = {
      customer: parsedCustId,
      items: djangoItems,
    };

    const res = await api.post("/invoices/", djangoPayload);
    return normalizeInvoice(res.data);
  },
  update: async (id: string | number, payload: Partial<Invoice>) => {
    const res = await api.patch(`/invoices/${id}/`, payload);
    return normalizeInvoice(res.data);
  },
  remove: async (id: string | number) => {
    await api.delete(`/invoices/${id}/`);
  },
  validate: async (id: string | number) => {
    const res = await api.post(`/invoices/${id}/validate/`, {});
    return normalizeInvoice(res.data);
  },
  /** Le PDF est généré côté backend (ReportLab) */
  downloadPdf: async (id: string | number) =>
    (await api.get<Blob>(`/invoices/${id}/pdf/`, { responseType: "blob" })).data,
  transmitEtva: async (id: string | number) =>
    (await api.post(`/invoices/${id}/transmit_etva/`, {})).data,
};
export const creditNotesService = {
  ...crud<Invoice>("credit-notes"),
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any[]>("/credit-notes/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list.map(normalizeInvoice);
  },
  downloadPdf: async (id: string | number) =>
    (await api.get<Blob>(`/credit-notes/${id}/pdf/`, { responseType: "blob" })).data,
};
export const usersService = {
  ...crud<User>("users"),
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any>("/users/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list;
  },
};

export const auditService = {
  ...crud<AuditEntry>("audit"),
  list: async (params?: Record<string, unknown>) => {
    const res = await api.get<any>("/audit/", { params });
    const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
    return list;
  },
};

export const companyService = {
  retrieve: async () => (await api.get<Company>("/company/")).data,
  update: async (payload: Partial<Company>) =>
    (await api.patch<Company>("/company/", payload)).data,
};

export const authService = {
  login: async (username: string, password: string) =>
    (await api.post<{ access?: string; token?: string; user: User }>("/auth/login/", { username, password }))
      .data,
  me: async () => (await api.get<User>("/auth/me/")).data,
  logout: async () => {
    await api.post("/auth/logout/", {});
  },
};

export const dashboardService = {
  summary: async () => (await api.get("/dashboard/stats/")).data,
};

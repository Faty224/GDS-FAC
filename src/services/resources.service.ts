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
 * Services REST — un endpoint par application Django.
 * Ces fonctions sont prêtes à remplacer les données de démonstration
 * dès que VITE_API_URL pointe vers le backend Django REST Framework.
 */

function crud<T extends { id: string }>(resource: string) {
  const base = `/${resource}/`;
  return {
    list: async (params?: Record<string, unknown>) => (await api.get<T[]>(base, { params })).data,
    retrieve: async (id: string) => (await api.get<T>(`${base}${id}/`)).data,
    create: async (payload: Partial<T>) => (await api.post<T>(base, payload)).data,
    update: async (id: string, payload: Partial<T>) =>
      (await api.patch<T>(`${base}${id}/`, payload)).data,
    remove: async (id: string) => {
      await api.delete(`${base}${id}/`);
    },
  };
}

export const customersService = crud<Customer>("clients");
export const productsService = crud<Product>("products");
export const billingSettingsService = crud<BillingSetting>("billing/settings");
export const invoicesService = {
  ...crud<Invoice>("billing/invoices"),
  validate: async (id: string) =>
    (await api.post<Invoice>(`/billing/invoices/${id}/validate/`, {})).data,
  /** Le PDF est généré côté backend (ReportLab) — jamais dans le navigateur. */
  downloadPdf: async (id: string) =>
    (await api.get<Blob>(`/pdf/invoices/${id}/`, { responseType: "blob" })).data,
};
export const creditNotesService = crud<Invoice>("credit-notes");
export const usersService = crud<User>("accounts/users");
export const auditService = crud<AuditEntry>("audit/entries");

export const companyService = {
  retrieve: async () => (await api.get<Company>("/companies/me/")).data,
  update: async (payload: Partial<Company>) =>
    (await api.patch<Company>("/companies/me/", payload)).data,
};

export const authService = {
  login: async (email: string, password: string) =>
    (await api.post<{ access: string; refresh: string }>("/accounts/token/", { email, password }))
      .data,
  me: async () => (await api.get<User>("/accounts/me/")).data,
  requestPasswordReset: async (email: string) => {
    await api.post("/accounts/password-reset/", { email });
  },
};

export const dashboardService = {
  summary: async () => (await api.get("/dashboard/summary/")).data,
};

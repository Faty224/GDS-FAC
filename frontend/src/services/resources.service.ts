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

export const customersService = crud<Customer>("customers");
export const productsService = crud<Product>("products");
export const billingSettingsService = crud<BillingSetting>("billing/settings");
export const invoicesService = {
  ...crud<Invoice>("invoices"),
  validate: async (id: string | number) =>
    (await api.post<Invoice>(`/invoices/${id}/validate/`, {})).data,
  /** Le PDF est généré côté backend (ReportLab) */
  downloadPdf: async (id: string | number) =>
    (await api.get<Blob>(`/invoices/${id}/pdf/`, { responseType: "blob" })).data,
  transmitEtva: async (id: string | number) =>
    (await api.post(`/invoices/${id}/transmit_etva/`, {})).data,
};
export const creditNotesService = {
  ...crud<Invoice>("credit-notes"),
  downloadPdf: async (id: string | number) =>
    (await api.get<Blob>(`/credit-notes/${id}/pdf/`, { responseType: "blob" })).data,
};
export const usersService = crud<User>("users");
export const auditService = crud<AuditEntry>("audit");

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

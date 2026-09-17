import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  demoAudit,
  demoBillingSettings,
  demoCompany,
  demoCustomers,
  demoInvoices,
  demoProducts,
  demoTransmissions,
  demoUsers,
} from "./demo-data";
import type {
  AuditEntry,
  BillingSetting,
  Company,
  Customer,
  EtvaTransmission,
  Invoice,
  PaymentRecord,
  Product,
  Role,
  User,
} from "./types";
import { IS_DEMO_MODE, getAccessToken, setAccessToken } from "@/services/api";
import { authService } from "@/services/resources.service";

/**
 * Couche d'état applicative.
 *
 * En MODE DÉMONSTRATION (aucune VITE_API_URL configurée), les données vivent ici
 * et sont persistées dans le navigateur afin de parcourir le cycle complet.
 * Une fois le backend Django branché, chaque action ci-dessous appelle le service
 * correspondant dans `src/services/` (même signature, mêmes types).
 */

const STORAGE_KEY = "gdsf.state.v1";
const SESSION_KEY = "gdsf.session.v1";

interface State {
  company: Company;
  users: User[];
  customers: Customer[];
  products: Product[];
  billingSettings: BillingSetting[];
  invoices: Invoice[];
  transmissions: EtvaTransmission[];
  audit: AuditEntry[];
  payments: PaymentRecord[];
}

const initialState: State = {
  company: demoCompany,
  users: demoUsers,
  customers: demoCustomers,
  products: demoProducts,
  billingSettings: demoBillingSettings,
  invoices: demoInvoices,
  transmissions: demoTransmissions,
  audit: demoAudit,
  payments: [],
};

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export type Permission =
  | "manage_users"
  | "manage_company"
  | "manage_settings"
  | "manage_customers"
  | "manage_products"
  | "manage_invoices"
  | "transmit_etva"
  | "view_audit";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "manage_users",
    "manage_company",
    "manage_settings",
    "manage_customers",
    "manage_products",
    "manage_invoices",
    "transmit_etva",
    "view_audit",
  ],
  facturier: ["manage_customers", "manage_products", "manage_invoices", "transmit_etva"],
  consultation: [],
};

interface StoreValue extends State {
  currentUser: User | null;
  isReady: boolean;
  can: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateCompany: (patch: Partial<Company>) => void;
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveBillingSetting: (setting: BillingSetting) => void;
  deleteBillingSetting: (id: string) => void;
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  validateInvoice: (id: string) => void;
  registerTransmission: (transmission: EtvaTransmission, invoicePatch: Partial<Invoice>) => void;
  registerPayment: (payment: PaymentRecord, totalTtc: number) => void;
  saveUser: (user: User) => void;
  deleteUser: (id: string) => void;
  logAudit: (action: string, target: string, result?: AuditEntry["result"]) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      if (!IS_DEMO_MODE) {
        const token = getAccessToken();
        if (token) {
          try {
            const me = await authService.me();
            setCurrentUser(me);
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(me));
          } catch {
            setAccessToken(null);
            setCurrentUser(null);
          }
        }
      } else {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
          const session = window.localStorage.getItem(SESSION_KEY);
          if (session) setCurrentUser(JSON.parse(session) as User);
        } catch {
          /* état corrompu : on repart des données de démonstration */
        }
      }
      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (IS_DEMO_MODE) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isReady]);

  const logAudit = useCallback(
    (action: string, target: string, result: AuditEntry["result"] = "succes") => {
      setState((s) => ({
        ...s,
        audit: [
          {
            id: uid("aud"),
            user: currentUser?.full_name ?? "Système",
            action,
            target,
            at: new Date().toISOString(),
            result,
          },
          ...s.audit,
        ],
      }));
    },
    [currentUser],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (!IS_DEMO_MODE) {
        try {
          const res = await authService.login(email, password);
          const token = res.access || res.token;
          if (token) setAccessToken(token);
          const user = res.user || (await authService.me());
          setCurrentUser(user);
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          return user;
        } catch (err: any) {
          throw new Error(
            err?.message || err?.detail || "Identifiants invalides ou serveur indisponible.",
          );
        }
      }
      const user = state.users.find(
        (u) =>
          (u.email.toLowerCase() === email.trim().toLowerCase() || u.username === email.trim()) &&
          u.is_active,
      );
      if (!user || password.length < 4) {
        throw new Error("Identifiants invalides. Vérifiez votre email et votre mot de passe.");
      }
      setCurrentUser(user);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    },
    [state.users],
  );

  const logout = useCallback(() => {
    if (!IS_DEMO_MODE) {
      authService.logout().catch(() => {});
      setAccessToken(null);
    }
    setCurrentUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const upsert = <T extends { id: string }>(list: T[], item: T) =>
    list.some((i) => i.id === item.id)
      ? list.map((i) => (i.id === item.id ? item : i))
      : [item, ...list];

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      currentUser,
      isReady,
      can: (permission) =>
        currentUser ? ROLE_PERMISSIONS[currentUser.role].includes(permission) : false,
      login,
      logout,
      logAudit,
      updateCompany: (patch) => setState((s) => ({ ...s, company: { ...s.company, ...patch } })),
      saveCustomer: (customer) =>
        setState((s) => ({ ...s, customers: upsert(s.customers, customer) })),
      deleteCustomer: (id) =>
        setState((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) })),
      saveProduct: (product) => setState((s) => ({ ...s, products: upsert(s.products, product) })),
      deleteProduct: (id) =>
        setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })),
      saveBillingSetting: (setting) =>
        setState((s) => ({ ...s, billingSettings: upsert(s.billingSettings, setting) })),
      deleteBillingSetting: (id) =>
        setState((s) => ({ ...s, billingSettings: s.billingSettings.filter((b) => b.id !== id) })),
      saveInvoice: (invoice) => setState((s) => ({ ...s, invoices: upsert(s.invoices, invoice) })),
      deleteInvoice: (id) =>
        setState((s) => ({ ...s, invoices: s.invoices.filter((i) => i.id !== id) })),
      validateInvoice: (id) =>
        setState((s) => ({
          ...s,
          invoices: s.invoices.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "validee",
                  history: [
                    ...i.history,
                    {
                      id: uid("h"),
                      label: "Facture validée",
                      at: new Date().toISOString(),
                      user: currentUser?.full_name ?? "Système",
                    },
                  ],
                }
              : i,
          ),
        })),
      registerTransmission: (transmission, invoicePatch) =>
        setState((s) => ({
          ...s,
          transmissions: [transmission, ...s.transmissions],
          invoices: s.invoices.map((i) =>
            i.id === transmission.invoice_id
              ? {
                  ...i,
                  ...invoicePatch,
                  history: [
                    ...i.history,
                    {
                      id: uid("h"),
                      label: `Transmission eTVA (simulation) — ${transmission.status}`,
                      at: transmission.sent_at,
                      user: currentUser?.full_name ?? "Système",
                    },
                  ],
                }
              : i,
          ),
        })),
      registerPayment: (payment: PaymentRecord, totalTtc: number) =>
        setState((s) => {
          const newPayments = [payment, ...s.payments];
          const invoicePayments = newPayments.filter((p) => p.invoice_id === payment.invoice_id);
          const totalPaid = invoicePayments.reduce((acc, curr) => acc + curr.amount, 0);

          let paymentStatus: "non_payee" | "partiellement_payee" | "payee" = "non_payee";
          if (totalPaid >= totalTtc) {
            paymentStatus = "payee";
          } else if (totalPaid > 0) {
            paymentStatus = "partiellement_payee";
          }

          const updatedInvoices = s.invoices.map((inv) =>
            inv.id === payment.invoice_id
              ? {
                  ...inv,
                  paid_amount: totalPaid,
                  payment_status: paymentStatus,
                  history: [
                    ...inv.history,
                    {
                      id: uid("h"),
                      label: `Enregistrement règlement (${payment.method.toUpperCase()}) — ${payment.amount} GNF`,
                      at: payment.payment_date,
                      user: currentUser?.full_name ?? "Système",
                    },
                  ],
                }
              : inv,
          );

          return {
            ...s,
            payments: newPayments,
            invoices: updatedInvoices,
          };
        }),
      saveUser: (user) => setState((s) => ({ ...s, users: upsert(s.users, user) })),
      deleteUser: (id) => setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) })),
      resetDemoData: () => setState(initialState),
    }),
    [state, currentUser, isReady, login, logout, logAudit],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé à l'intérieur de <StoreProvider>");
  return ctx;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  facturier: "Facturier",
  consultation: "Consultation",
};

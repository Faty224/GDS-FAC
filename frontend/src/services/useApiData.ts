/**
 * Hook universel de chargement de données depuis l'API Django REST.
 * En mode DEMO (sans VITE_API_URL), retourne les données du store local.
 * En mode RÉEL, charge depuis le backend à chaque montage du composant.
 */
import { useCallback, useEffect, useState } from "react";
import { IS_DEMO_MODE } from "./api";
import {
  customersService,
  productsService,
  billingSettingsService,
  invoicesService,
  creditNotesService,
  companyService,
  dashboardService,
  auditService,
  usersService,
} from "./resources.service";
import type { Company, Customer, Product, BillingSetting, Invoice } from "@/lib/types";

type LoadingState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function useApiList<T>(
  fetcher: () => Promise<T[]>,
  fallback: T[],
): LoadingState<T[]> {
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (IS_DEMO_MODE) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      const list = Array.isArray(result) ? result : (result as any).results ?? [];
      setData(list);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []); // Run once on mount

  return { data, loading, error, reload: load };
}

export function useCustomers(fallback: Customer[] = []) {
  return useApiList<Customer>(customersService.list, fallback);
}

export function useProducts(fallback: Product[] = []) {
  return useApiList<Product>(productsService.list, fallback);
}

export function useBillingSettings(fallback: BillingSetting[] = []) {
  return useApiList<BillingSetting>(billingSettingsService.list, fallback);
}

export function useInvoices(fallback: Invoice[] = []) {
  return useApiList<Invoice>(invoicesService.list, fallback);
}

export function useCreditNotes(fallback: Invoice[] = []) {
  return useApiList<Invoice>(creditNotesService.list, fallback);
}

export function useAuditLogs(fallback: any[] = []) {
  return useApiList(auditService.list, fallback);
}

export function useUsers(fallback: any[] = []) {
  return useApiList(usersService.list, fallback);
}

export function useCompany(fallback?: Company) {
  const [data, setData] = useState<Company | undefined>(fallback);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (IS_DEMO_MODE) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await companyService.retrieve();
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement entreprise.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  return { data, loading, error, reload: load };
}

export function useDashboardStats(fallback: any = {}) {
  const [data, setData] = useState<any>(fallback);
  const [loading, setLoading] = useState(!IS_DEMO_MODE);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (IS_DEMO_MODE) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.summary();
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);
  return { data, loading, error, reload: load };
}

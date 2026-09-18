import { api } from "./api";
import type { EtvaTransmission, Invoice } from "@/lib/types";

/**
 * INTÉGRATION eTVA — DGI
 *
 * Aucun endpoint, schéma JSON, code retour ni mécanisme d'authentification de l'API eTVA
 * n'est inventé ici. La transmission réelle est effectuée par le backend Django
 * (application `etva/`), qui détient seul les credentials et certificats.
 *
 * Le frontend appelle uniquement une route interne du backend :
 *   POST /api/etva/transmissions/  { invoice_id }
 * Le contrat exact sera aligné sur le Swagger officiel de la DGI dès sa mise à disposition.
 */

export interface TransmissionResult {
  transmission: EtvaTransmission;
  invoicePatch: Partial<Invoice>;
}

export async function transmitInvoice(invoice: Invoice): Promise<TransmissionResult> {
  const started = Date.now();
  const { data, status } = await api.post(`/invoices/${invoice.id}/transmit_etva/`);
  // La structure de `data` suit le sérialiseur Django, lui-même aligné sur la réponse DGI.
  return {
    transmission: {
      ...(data as EtvaTransmission),
      http_status: status,
      duration_ms: Date.now() - started,
    },
    invoicePatch: {
      status: (data as EtvaTransmission).status === "accepte" ? "acceptee" : "rejetee",
      etva_status: (data as EtvaTransmission).status,
      etva_reference: (data as EtvaTransmission).dgi_reference,
      etva_message: (data as EtvaTransmission).message,
    },
  };
}

/** Historique des transmissions (backend Django : application `etva/`). */
export async function listTransmissions(): Promise<EtvaTransmission[]> {
  const { data } = await api.get<EtvaTransmission[]>("/etva/transmissions/");
  return data;
}

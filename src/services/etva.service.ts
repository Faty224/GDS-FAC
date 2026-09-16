import { api, IS_DEMO_MODE } from "./api";
import type { EtvaTransmission, Invoice } from "@/lib/types";
import { uid } from "@/lib/store";

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
 *
 * Tant qu'aucun backend n'est configuré, `transmitInvoice` renvoie une réponse
 * MODE SIMULATION / DEMO, explicitement identifiée comme telle dans l'interface.
 * Ce n'est en aucun cas une transmission réelle à la DGI.
 */

export interface TransmissionResult {
  transmission: EtvaTransmission;
  invoicePatch: Partial<Invoice>;
}

export async function transmitInvoice(invoice: Invoice): Promise<TransmissionResult> {
  if (!IS_DEMO_MODE) {
    const started = Date.now();
    const { data, status } = await api.post("/etva/transmissions/", { invoice_id: invoice.id });
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

  // ---- MODE SIMULATION / DEMO ----
  const started = Date.now();
  await new Promise((r) => setTimeout(r, 1400));
  const customerHasNifp = Boolean(invoice.customer_id);
  const accepted = customerHasNifp && invoice.lines.length > 0;
  const sent_at = new Date().toISOString();

  const transmission: EtvaTransmission = {
    id: uid("tr"),
    invoice_id: invoice.id,
    invoice_reference: invoice.reference,
    document_type: invoice.document_type,
    sent_at,
    status: accepted ? "accepte" : "rejete",
    dgi_reference: accepted ? `DEMO-REF-${Math.floor(Math.random() * 900000 + 100000)}` : null,
    message: accepted
      ? "Réponse simulée : document accepté. MODE SIMULATION — aucun échange réel avec la DGI."
      : "Réponse simulée : document rejeté (données incomplètes). MODE SIMULATION — aucun échange réel avec la DGI.",
    http_status: accepted ? 200 : 422,
    duration_ms: Date.now() - started,
    operation: invoice.document_type === "avoir" ? "transmission_avoir" : "transmission_facture",
    mode: "simulation",
  };

  return {
    transmission,
    invoicePatch: {
      status: accepted ? "acceptee" : "rejetee",
      etva_status: accepted ? "accepte" : "rejete",
      etva_reference: transmission.dgi_reference,
      etva_message: transmission.message,
    },
  };
}

/** Historique des transmissions (backend Django : application `etva/`). */
export async function listTransmissions(): Promise<EtvaTransmission[]> {
  const { data } = await api.get<EtvaTransmission[]>("/etva/transmissions/");
  return data;
}

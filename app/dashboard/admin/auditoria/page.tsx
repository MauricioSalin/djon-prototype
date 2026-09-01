import { notFound } from "next/navigation";

export default function AuditPage() {
  // A coleta permanece ativa na API; a interface de auditoria é
  // intencionalmente inacessível, inclusive por URL direta.
  notFound();
}

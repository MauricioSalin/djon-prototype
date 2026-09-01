import { notFound } from "next/navigation";
import { AuditDebugPage } from "@/components/audit-debug-page";

export const dynamic = "force-dynamic";

export default async function PrivateAuditPage({
  params,
}: {
  params: Promise<{ auditAccessKey: string }>;
}) {
  const { auditAccessKey } = await params;
  const configuredKey = process.env.AUDIT_ROUTE_KEY?.trim();

  if (
    !configuredKey ||
    configuredKey.length < 24 ||
    auditAccessKey !== configuredKey
  ) {
    notFound();
  }

  return <AuditDebugPage />;
}

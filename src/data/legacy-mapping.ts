export type LegacyExecutionRow = { id: string; numeroOs: string; status: string; problemaIdentificado: string | null; dataCriacao: Date; atualizadoEm: Date };
const eligibleStatuses = new Set(["EM_DIAGNOSTICO", "AGUARDANDO_APROVACAO", "APROVADA", "EM_EXECUCAO", "FINALIZADA", "ENTREGUE"]);
export function isExecutionRecord(status: string): boolean { return eligibleStatuses.has(status); }
export function toExecutionItem(row: LegacyExecutionRow): Record<string, unknown> {
  if (!isExecutionRecord(row.status)) throw new Error(`Status outside execution boundary: ${row.status}`);
  return {
    PK: `EXECUTION#${row.id}`, SK: "METADATA", GSI1PK: `STATUS#${row.status}`,
    GSI1SK: `${row.dataCriacao.toISOString()}#${row.id}`, entityType: "Execution",
    executionId: row.id, externalOrderId: row.id, externalOrderNumber: row.numeroOs,
    status: row.status, diagnosis: row.problemaIdentificado,
    createdAt: row.dataCriacao.toISOString(), updatedAt: row.atualizadoEm.toISOString(), version: 0
  };
}

# Contratos planejados

## Comandos consumidos

- `execution.enqueue.requested.v1`
- `execution.cancel.requested.v1` (compensação)

## Eventos publicados

- `execution.queued.v1`
- `execution.diagnosis.started.v1`
- `execution.repair.started.v1`
- `execution.completed.v1`
- `execution.cancelled.v1`
- `execution.operation.failed.v1`

Todos os envelopes deverão conter `messageId`, `correlationId`, `sagaId`, `causationId`, versão e data de ocorrência. O schema detalhado será versionado antes da integração.

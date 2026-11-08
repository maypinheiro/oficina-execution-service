# Contratos de mensageria v1

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

O contrato está em `src/messaging/message-envelope.ts`. Ele exige identificação, tipo, natureza, versão, data, origem, agregado, correlação e payload. `sagaId` e `causationId` preservam a cadeia causal. A fila recebe comandos e eventos SNS, possui DLQ e idempotência por escrita condicional no DynamoDB.

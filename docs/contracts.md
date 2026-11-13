# Contratos de mensageria v1

## Comandos consumidos

- `StartExecution`: inicia a execução para a OS correlacionada.
- `CompleteExecution`: conclui a execução em andamento de forma condicional.
- `CancelExecution`: compensa a execução e libera os recursos reservados.

## Eventos publicados

- `ExecutionStarted`: confirma o início e informa `executionId`.
- `ExecutionCompleted`: confirma a conclusão técnica e informa `executionId`.
- `ExecutionCancelled`: confirma a compensação.

O contrato está em `src/messaging/message-envelope.ts`. Ele exige identificação, tipo, natureza, versão, data, origem, agregado, correlação e payload. `sagaId` e `causationId` preservam a cadeia causal. A fila recebe comandos e eventos SNS, possui DLQ e idempotência por escrita condicional no DynamoDB.

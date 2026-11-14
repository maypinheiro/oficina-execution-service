# Decisões arquiteturais do Execution Service

As decisões globais estão na [RFC de divisão dos microsserviços](https://github.com/maypinheiro/oficina-api/blob/main/docs/fase4/rfc-006-divisao-microservicos.md),
na [RFC da Saga](https://github.com/maypinheiro/oficina-api/blob/main/docs/fase4/rfc-007-saga-orquestrada.md)
e nos [ADRs da Fase 4](https://github.com/maypinheiro/oficina-api/tree/main/docs/fase4/adrs).

## EXE-ADR-001 — DynamoDB exclusivo

- **Estado:** aceita.
- **Decisão:** persistir a execução em tabela DynamoDB própria, com chave
  composta e GSI para fila por status/data.
- **Motivo:** o agregado é consultado por execução/OS, possui mudanças frequentes
  e não exige joins; o modelo demonstra o banco NoSQL obrigatório.
- **Alternativas:** compartilhar PostgreSQL foi rejeitado por violar autonomia;
  PostgreSQL exclusivo seria válido, mas não demonstraria persistência poliglota.
- **Consequência:** consistência e integridade são garantidas por condições de
  escrita e desenho de acesso, não por foreign keys.

## EXE-ADR-002 — Escritas condicionais

- **Estado:** aceita.
- **Decisão:** iniciar somente se a chave não existir e concluir somente em
  `IN_EXECUTION`.
- **Motivo:** mensagens SQS podem repetir ou chegar fora de ordem.
- **Consequência:** duplicação e transição inválida falham sem corromper estado;
  o consumidor pode reprocessar com segurança.

## EXE-ADR-003 — Único caminho de escrita por mensageria

- **Estado:** aceita.
- **Decisão:** expor somente `/health` por HTTP e alterar execução via comandos
  SQS.
- **Motivo:** uma API REST concorrente criaria dois caminhos de alteração e ordem
  de eventos ambígua.
- **Consequência:** o OS Service é a borda de comando/consulta global e o
  Execution permanece desacoplado.

## EXE-ADR-004 — Inbox DynamoDB e entrega at-least-once

- **Estado:** aceita.
- **Decisão:** deduplicar `messageId` na mesma tabela e confirmar a mensagem SQS
  somente após persistência e publicação do resultado.
- **Motivo:** SQS garante entrega pelo menos uma vez, não exatamente uma vez.
- **Consequência:** handlers e compensações são reentrantes; falhas esgotadas
  seguem para DLQ e podem ser reprocessadas de forma auditável.

## EXE-ADR-005 — Compensação por liberação de reserva

- **Estado:** aceita.
- **Decisão:** `CancelExecution` grava `CANCELLED` e
  `resourcesReserved=false`, publicando `ExecutionCancelled`.
- **Motivo:** compensação precisa desfazer o efeito de negócio, não apenas gerar
  log ou mover mensagem para DLQ.
- **Consequência:** o OS só avança para compensar o Billing após confirmação do
  Execution.

## EXE-ADR-006 — Deploy independente no EKS

- **Estado:** aceita.
- **Decisão:** namespace, imagem, manifests, HPA, PDB, Terraform e pipeline
  próprios em cluster EKS compartilhado.
- **Motivo:** autonomia de deploy e escala com custo compatível ao Learner Lab.
- **Consequência:** o serviço pode ser escalado/republicado sem release do OS ou
  Billing; o cluster e Datadog continuam componentes compartilhados.

## EXE-ADR-007 — Compatibilidade AWS Academy

- **Estado:** aceita com dívida técnica explícita.
- **Decisão:** injetar sessão STS temporária via GitHub Environment enquanto
  IRSA/Pod Identity estiver indisponível.
- **Consequência:** a sessão expira e requer novo CD; em conta permanente deve
  existir identidade de workload restrita à tabela, fila, DLQ e tópico.

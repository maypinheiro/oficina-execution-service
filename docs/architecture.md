# Arquitetura e limites

O Execution Service será o único proprietário da fila de trabalho, diagnóstico, etapas de reparo, apontamentos e conclusão operacional. O DynamoDB próprio atende atualizações frequentes por OS e demonstra o banco não relacional exigido.

Comandos chegam por SQS e resultados são publicados por SNS. Consumidores serão idempotentes, falhas terão retry e DLQ, e nenhum banco será compartilhado.

Na Saga orquestrada, Execution executa ou compensa sua participação, enquanto o OS Service conserva a visão global.

O ciclo operacional usa dois comandos principais. `StartExecution` cria o item de execução no DynamoDB com escrita condicional e publica `ExecutionStarted`. Quando o operador solicita a finalização pela API da OS, o orquestrador grava `CompleteExecution` na outbox; o Execution Service altera o item apenas se estiver `IN_EXECUTION` e publica `ExecutionCompleted`. A condição no DynamoDB impede conclusão fora de ordem, e a inbox impede efeitos duplicados.

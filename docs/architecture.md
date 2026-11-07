# Arquitetura e limites

O Execution Service será o único proprietário da fila de trabalho, diagnóstico, etapas de reparo, apontamentos e conclusão operacional. O DynamoDB próprio atende atualizações frequentes por OS e demonstra o banco não relacional exigido.

Comandos chegam por SQS e resultados são publicados por SNS. Consumidores serão idempotentes, falhas terão retry e DLQ, e nenhum banco será compartilhado.

Na Saga orquestrada, Execution executa ou compensa sua participação, enquanto o OS Service conserva a visão global.

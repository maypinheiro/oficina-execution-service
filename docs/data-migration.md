# Migração e isolamento dos dados

O Execution usa a tabela indicada por `EXECUTION_TABLE_NAME`. O migrador lê somente OS em estados pertencentes à operação e grava itens com chaves estáveis. Para LocalStack, configurar `DYNAMODB_ENDPOINT`.

```bash
npm run data:migrate
npm run data:reconcile
```

A reconciliação compara a quantidade elegível no PostgreSQL legado com os itens do DynamoDB. A tabela usa pagamento sob demanda, criptografia, point-in-time recovery e índice `GSI1` para fila por status/data.

O papel de runtime deverá possuir ações somente sobre a tabela e seus índices. `LEGACY_DATABASE_URL` existe apenas durante a migração e será revogada após o cutover.

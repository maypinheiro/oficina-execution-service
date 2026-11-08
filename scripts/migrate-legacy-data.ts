import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { Client } from "pg";
import { isExecutionRecord, toExecutionItem, type LegacyExecutionRow } from "../src/data/legacy-mapping.js";

const sourceUrl = process.env.LEGACY_DATABASE_URL;
const tableName = process.env.EXECUTION_TABLE_NAME;
if (!sourceUrl || !tableName) throw new Error("LEGACY_DATABASE_URL and EXECUTION_TABLE_NAME are required");
const targetTableName: string = tableName;
const source = new Client({ connectionString: sourceUrl });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1", endpoint: process.env.DYNAMODB_ENDPOINT }));
async function main(): Promise<void> {
 await source.connect();
 try {
  const result = await source.query(`SELECT id, "numeroOs", status::text, "problemaIdentificado", "dataCriacao", "atualizadoEm" FROM "OrdemDeServico" ORDER BY "dataCriacao", id`);
  const items = (result.rows as LegacyExecutionRow[]).filter(row => isExecutionRecord(row.status)).map(toExecutionItem);
  for (let index = 0; index < items.length; index += 25) {
    let requests: NonNullable<BatchWriteCommandInput["RequestItems"]>[string] = items.slice(index, index + 25).map(Item => ({ PutRequest: { Item } }));
    do {
      const response = await dynamo.send(new BatchWriteCommand({ RequestItems: { [targetTableName]: requests } }));
      requests = response.UnprocessedItems?.[targetTableName] ?? [];
    } while (requests.length > 0);
  }
  console.log(JSON.stringify({ migratedExecutions: items.length }));
 } finally { await source.end(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

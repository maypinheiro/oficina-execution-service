import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Client } from "pg";

const sourceUrl = process.env.LEGACY_DATABASE_URL;
const tableName = process.env.EXECUTION_TABLE_NAME;
if (!sourceUrl || !tableName) throw new Error("LEGACY_DATABASE_URL and EXECUTION_TABLE_NAME are required");
const targetTableName: string = tableName;
const source = new Client({ connectionString: sourceUrl });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1", endpoint: process.env.DYNAMODB_ENDPOINT }));
async function main(): Promise<void> {
 await source.connect();
 try {
  const expectedResult = await source.query(`SELECT count(*)::int count FROM "OrdemDeServico" WHERE status::text IN ('EM_DIAGNOSTICO','AGUARDANDO_APROVACAO','APROVADA','EM_EXECUCAO','FINALIZADA','ENTREGUE')`);
  let actual = 0; let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(new ScanCommand({
      TableName: targetTableName,
      Select: "COUNT",
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: { ":entityType": "Execution" },
      ExclusiveStartKey: startKey
    }));
    actual += page.Count ?? 0; startKey = page.LastEvaluatedKey;
  } while (startKey);
  const expected = expectedResult.rows[0].count as number;
  const ok = expected === actual;
  console.log(JSON.stringify({ ok, expected, actual }, null, 2));
  if (!ok) process.exitCode = 2;
 } finally { await source.end(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

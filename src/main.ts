import { createServer } from "node:http";
import { handleRequest } from "./app.js";
import { observeHttp } from "./observability/http.js";
import { log } from "./observability/logger.js";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AwsMessageTransport } from "./messaging/aws-transport.js";
import { DynamoDbMessageInbox } from "./messaging/dynamodb-inbox.js";
import { SqsMessageWorker } from "./messaging/sqs-worker.js";
import { DynamoDbExecutionStore } from "./saga/dynamodb-execution-store.js";
import { ExecutionCommandHandler } from "./saga/execution-command-handler.js";
import { ExecutionMessageProcessor } from "./saga/execution-message-processor.js";

const port = Number(process.env.PORT ?? 3000);
createServer(observeHttp(handleRequest)).listen(port, "0.0.0.0", () => {
  log("info", "service_started", { port });
});

const tableName = process.env.EXECUTION_TABLE_NAME;
const queueUrl = process.env.COMMAND_QUEUE_URL;
const topicArn = process.env.DOMAIN_EVENTS_TOPIC_ARN;
if (!tableName || !queueUrl || !topicArn) {
  log("warn", "saga_worker_disabled", { reason: "EXECUTION_TABLE_NAME, COMMAND_QUEUE_URL or DOMAIN_EVENTS_TOPIC_ARN not configured" });
} else {
  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const processor = new ExecutionMessageProcessor(
    new DynamoDbMessageInbox(documentClient, tableName),
    new ExecutionCommandHandler(new DynamoDbExecutionStore(documentClient, tableName)),
    new AwsMessageTransport(),
    topicArn,
  );
  const worker = new SqsMessageWorker(new SQSClient({}), queueUrl, (body) => processor.process(body));
  void worker.start();
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, () => worker.stop());
}

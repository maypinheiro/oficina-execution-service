import { createServer } from "node:http";
import { handleRequest } from "./app.js";
import { observeHttp } from "./observability/http.js";
import { log } from "./observability/logger.js";

const port = Number(process.env.PORT ?? 3000);
createServer(observeHttp(handleRequest)).listen(port, "0.0.0.0", () => {
  log("info", "service_started", { port });
});

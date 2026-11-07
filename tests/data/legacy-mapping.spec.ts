import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isExecutionRecord, toExecutionItem } from "../../src/data/legacy-mapping.js";

describe("legacy execution mapping", () => {
  it("selects only execution records", () => { assert.equal(isExecutionRecord("EM_DIAGNOSTICO"), true); assert.equal(isExecutionRecord("RECEBIDA"), false); });
  it("creates stable keys", () => {
    const item = toExecutionItem({ id: "os-1", numeroOs: "OS-1", status: "EM_EXECUCAO", problemaIdentificado: "Freio", dataCriacao: new Date("2026-01-01T00:00:00Z"), atualizadoEm: new Date("2026-01-02T00:00:00Z") });
    assert.equal(item.PK, "EXECUTION#os-1"); assert.equal(item.GSI1PK, "STATUS#EM_EXECUCAO");
  });
  it("rejects records outside boundary", () => assert.throws(() => toExecutionItem({ id: "os-1", numeroOs: "OS-1", status: "RECEBIDA", problemaIdentificado: null, dataCriacao: new Date(), atualizadoEm: new Date() })));
});

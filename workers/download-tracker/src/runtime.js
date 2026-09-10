/**
 * EmployeeLock hosted runtime. Hash a proposed row; never store xlsx.
 * /v1 never touches DOWNLOADS KV.
 * /v1/mesh/* PROXY to aziel-runtime via AZIEL_RUNTIME (handled in index.js before this catch-all).
 */
import { meshOpenApiPaths, meshPointer } from "./mesh.js";
const PRODUCT = "employeelock";
const EXAMPLE_PAYLOAD = {
  "event": "process outcome recorded with no named owner",
  "result": "row logged as format proof",
  "owner_named": "",
  "confidence": 0.7
};

const VERSION = "0.1.0";
const SPEC = "employeelock-v0";
const HOST = "https://employeelock-download-tracker.vibelock.workers.dev";
const CATALOG = "https://aziel-runtime.vibelock.workers.dev";
const GENESIS_PREV = "0".repeat(64);
const CONF_PLACEHOLDER = "__EL_CONFIDENCE__";
const PROTOCOL = "2025-03-26";

const SKILL = '---\nname: EmployeeLock\ndescription: Use when an assistant should log an accountability row or verify an EmployeeLock workbook via hosted /v1 (append-preview, verify-canonical) or aziel-runtime. Dual surface: Worker /v1 + catalog MCP. This Worker /v1/mesh/* PROXY to aziel-runtime via AZIEL_RUNTIME. Suite mesh default OFF. QNM-BUILD-1.0 live|locked|isolated. No Node Gate. No auto-heal. Not anonymity. Author Aziel Eliab.\n---\n\n# EmployeeLock\n\nHash-chained accountability workbook. Local CLI + sheet. Author: **Aziel Eliab**.\n\n**THIS IS:** workbook + hash chain (COVER, LOG, EVIDENCE, CHAIN, OWNERS, DASH, LISTS) + CLI (init / append / import / verify / ui / doctor).\n\n**THIS IS NOT:** a court filing, exhibit stickerer, counsel, UL or BAL paper, truth score, consensus, token, remote uploader, or a charge sheet. Hosted `/v1` never stores xlsx.\n\nHonest banner: workbook + hash chain, not a court.\n\nAlways send `User-Agent: Mozilla/5.0`. Cloudflare Workers may 403 an empty agent.\n\n## Call these URLs\n\n- Worker OpenAPI: https://employeelock-download-tracker.vibelock.workers.dev/openapi.json\n- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json\n- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`\n- Live skill (this markdown): `GET https://employeelock-download-tracker.vibelock.workers.dev/v1/skill`\n- Suite mesh: `GET https://employeelock-download-tracker.vibelock.workers.dev/v1/mesh` (PROXY; default OFF)\n\nOps (do **not** increment downloads or views):\n\n- `POST /v1/append-preview` — hash a proposed LOG row; nothing is stored\n- `POST /v1/verify-canonical` — recompute SHA-256 of posted canonical JSON or fields\n- `GET /v1/health`\n- `GET /v1/skill` — this file\n- `GET /v1/mesh` — PROXY suite mesh status. Default OFF. QNM live|locked|isolated. Never enables.\n- `GET /v1/mesh/nodes` — PROXY Live Nodes roster (5-minute presence).\n- `POST /v1/mesh/{enable,disable,join,heartbeat,leave,broadcast}` — PROXY. Bearer required to enable. No auto-heal. Anon-broadcast is not a publish path.\n\nCatalog aliases: `POST /p/employeelock/append-preview`, `POST /p/employeelock/verify-canonical`, `GET /p/employeelock/skill`.\n\nMCP tools: `employeelock_append-preview`, `employeelock_verify-canonical`, `employeelock_health`, `employeelock_skill`.\n\nWorks with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other MCP/OpenAPI-capable assistants. Catalog MCP `mesh_*` + FragGate `slug=mesh`. Suite mesh default OFF. QNM-BUILD-1.0 live|locked|isolated. No Node Gate. No auto-heal. Not anonymity.\n\nChatGPT: GPT Actions (import OpenAPI). Grok: custom tool / OpenAPI / MCP. Venice: HTTP tools. Claude, Cursor, Glama, and other MCP clients: catalog MCP. Remaining OpenAPI-capable assistants: same Worker or catalog `/openapi.json`.\n\n## Kid-plain field names\n\nUse these. The hosted API also accepts the long hashed names.\n\n| kid-plain | hashed field | meaning |\n|-----------|--------------|---------|\n| event | event | what happened |\n| result | result | what followed |\n| blame | blame_placed | who is responsible, or blank |\n| owner | owner_named | who owns the record. blank → UNOWNED |\n| short | outcome_short | near effect |\n| long | outcome_long | lasting effect |\n\nBlank `owner` flags **UNOWNED**. Filled `renamed_from` flags **RENAMED**. `confidence` is observer-assigned (not a truth score). Path B: append only; do not rewrite a hashed cell. A later long outcome is a new row that cites the old `row_hash`.\n\n## Example\n\n```bash\ncurl -s -A \'Mozilla/5.0\' https://employeelock-download-tracker.vibelock.workers.dev/v1/health\ncurl -s -A \'Mozilla/5.0\' https://employeelock-download-tracker.vibelock.workers.dev/v1/skill\ncurl -s -A \'Mozilla/5.0\' https://employeelock-download-tracker.vibelock.workers.dev/v1/mesh\ncurl -s -A \'Mozilla/5.0\' -X POST https://employeelock-download-tracker.vibelock.workers.dev/v1/append-preview \\\n  -H \'content-type: application/json\' \\\n  -d \'{"event":"desk closed","result":"logged","blame":"","owner":"records desk","short":"row added","long":"chain grew","confidence":0.7}\'\ncurl -s -A \'Mozilla/5.0\' https://aziel-runtime.vibelock.workers.dev/p/employeelock/skill\n```\n\n## Local (after one-click install)\n\n```bash\ncurl -fsSL https://employeelock-download-tracker.vibelock.workers.dev/install.sh | bash\nemployeelock ui\nemployeelock doctor\npython3 employeelock.py verify WORKBOOK.xlsx\n```\n\nPaper: EL-WP-0.1 · DOI https://doi.org/10.5281/zenodo.22257493 · Apache-2.0. Forks welcome.\n\nLocal UI: Import JSON file and Export JSON. Sample payload: GET https://employeelock-download-tracker.vibelock.workers.dev/v1/example. Worker homepage Live Nodes strip polls `GET /v1/mesh` (default OFF).\n';
const LIMITATION =
  "THIS IS: workbook (COVER, LOG, EVIDENCE, CHAIN, OWNERS, DASH, LISTS) + CLI (init/append/import/verify) + linear hash chain + countermeasure against unowned/renamed rows. THIS IS NOT: UL or a BAL issue paper; FoldLock; TemporalLock (borrows ethic, different product); court filing / exhibit stickerer / counsel; truth score / consensus / token; remote uploader / anonymous relay; a charge sheet against a named living person. Demo rows are generic format proof, not case facts. Hosted API never stores xlsx. Not a court. Not UL. Not a truth score.";

const HASHED_FIELDS = [
  "entry_id",
  "timestamp",
  "event",
  "result",
  "blame_placed",
  "owner_named",
  "renamed_from",
  "outcome_short",
  "outcome_long",
  "evidence_ids",
  "confidence",
  "observer",
  "file_sha256s",
  "prev_hash",
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Aziel-Runtime-Token, User-Agent, MCP-Protocol-Version, mcp-session-id",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function html(body) {
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
  });
}

function originOf(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return HOST;
  }
}

function formatConfidence(confidence) {
  const n = Number(confidence);
  if (!Number.isFinite(n)) return "0.000000";
  return n.toFixed(6);
}

function asStr(v) {
  if (v == null) return "";
  return String(v);
}

function canonicalJson(fields) {
  const payload = {};
  for (const key of HASHED_FIELDS) {
    payload[key] = key === "confidence" ? CONF_PLACEHOLDER : asStr(fields[key]);
  }
  const keys = Object.keys(payload).sort();
  let raw = "{" + keys.map((k) => JSON.stringify(k) + ":" + JSON.stringify(payload[k])).join(",") + "}";
  raw = raw.replace(`"${CONF_PLACEHOLDER}"`, formatConfidence(fields.confidence));
  return raw;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pickFields(body) {
  const src = body && typeof body === "object" ? body : {};
  const row = src.row && typeof src.row === "object" ? src.row : src;
  return {
    entry_id: asStr(row.entry_id || "EL-0001"),
    timestamp: asStr(row.timestamp || row.timestamp_utc || ""),
    event: asStr(row.event || ""),
    result: asStr(row.result || ""),
    blame_placed: asStr(row.blame_placed != null ? row.blame_placed : row.blame || ""),
    owner_named: asStr(row.owner_named != null ? row.owner_named : row.owner || ""),
    renamed_from: asStr(row.renamed_from || ""),
    outcome_short: asStr(row.outcome_short != null ? row.outcome_short : row.short || ""),
    outcome_long: asStr(row.outcome_long != null ? row.outcome_long : row.long || ""),
    evidence_ids: asStr(row.evidence_ids || ""),
    confidence: row.confidence == null || row.confidence === "" ? 0.7 : Number(row.confidence),
    observer: asStr(row.observer || "operator"),
    file_sha256s: asStr(row.file_sha256s || ""),
    prev_hash: asStr(row.prev_hash || GENESIS_PREV),
  };
}

async function appendPreview(body) {
  const fields = pickFields(body || {});
  if (!fields.timestamp) {
    fields.timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  const canonical = canonicalJson(fields);
  const digest = await sha256Hex(canonical);
  const unowned = fields.owner_named.trim() === "" ? "UNOWNED" : "owned";
  const name_moved = fields.renamed_from.trim() === "" ? "stable" : "RENAMED";
  return {
    product: PRODUCT,
    version: VERSION,
    spec: SPEC,
    kv_increment: false,
    stored: false,
    limitation: LIMITATION,
    fields,
    canonical,
    row_hash: digest,
    unowned,
    name_moved,
    genesis: fields.prev_hash === GENESIS_PREV,
  };
}

async function verifyCanonical(body) {
  const src = body && typeof body === "object" ? body : {};
  let canonical = src.canonical != null ? String(src.canonical) : null;
  let fields = null;
  if (!canonical) {
    fields = pickFields(src);
    canonical = canonicalJson(fields);
  }
  const recomputed = await sha256Hex(canonical);
  const posted = src.row_hash ? String(src.row_hash) : null;
  const ok = posted == null ? true : posted === recomputed;
  return {
    product: PRODUCT,
    version: VERSION,
    spec: SPEC,
    kv_increment: false,
    stored: false,
    limitation: LIMITATION,
    ok,
    canonical,
    row_hash: recomputed,
    posted_row_hash: posted,
    fields,
  };
}

function openapiSpec(origin) {
  return {
    openapi: "3.1.0",
    info: {
      title: "EmployeeLock runtime",
      version: VERSION,
      summary: "Hash-chained accountability workbook preview. Not a court. Not UL. Not a truth score.",
      description: LIMITATION + " Suite mesh /v1/mesh/* PROXY to aziel-runtime (AZIEL_RUNTIME). Default OFF. QNM-BUILD-1.0 live|locked|isolated. No Node Gate. No auto-heal. Not anonymity. Aziel Eliab only.",
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
      contact: { name: "Aziel Eliab", url: "https://github.com/AzielEliab/employeelock" },
    },
    servers: [{ url: origin }],
    paths: {
            "/v1/example": { get: { operationId: "employeelockExample", summary: "Sample JSON payload. Does not increment downloads.", responses: { "200": { description: "OK" } } } },
      ...meshOpenApiPaths(),
      "/v1/health": {
        get: {
          operationId: "employeelock_health",
          summary: "Liveness. Does not increment download KV. Hosted never stores xlsx.",
          responses: { "200": { description: "ok" } },
        },
      },
      "/v1/append-preview": {
        post: {
          operationId: "employeelock_append-preview",
          summary: "Hash a proposed LOG row without writing a file. Hosted never stores xlsx.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object" },
                example: {
                  event: "process outcome recorded with no named owner",
                  result: "row logged as format proof",
                  owner_named: "",
                  confidence: 0.7,
                },
              },
            },
          },
          responses: { "200": { description: "canonical + row_hash" } },
        },
      },
      "/v1/verify-canonical": {
        post: {
          operationId: "employeelock_verify-canonical",
          summary: "Recompute SHA-256 of posted canonical JSON (or fields). Not a truth score.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: { "200": { description: "ok + row_hash" } },
        },
      },
      "/v1/skill": {
        get: {
          operationId: "employeelock_skill",
          summary: "Return EmployeeLock skill markdown. Does not increment downloads or views. Hosted never stores xlsx.",
          responses: { "200": { description: "text/markdown skill body" } },
        },
      },
    },
  };
}

function aiHtml(origin) {
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>EmployeeLock — AI runtime</title>
<style>
  :root { color-scheme: dark; }
  body { font: 16px/1.45 system-ui, sans-serif; max-width: 44rem; margin: 3rem auto; padding: 0 1.25rem; background: #0e1014; color: #e8eaef; }
  a { color: #c9d4ff; }
  .banner { border: 1px solid #5c4a1a; background: #241c0d; color: #f0d78c; padding: .85rem 1rem; border-radius: 8px; }
  pre { background: #151922; padding: .85rem 1rem; overflow: auto; border-radius: 8px; }
</style>
<body>
<h1>EmployeeLock runtime</h1>
<p class="banner">${LIMITATION}</p>
<p>Works with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other MCP/OpenAPI-capable assistants.</p>
<p>OpenAPI: <a href="${origin}/openapi.json">${origin}/openapi.json</a></p>
<p>MCP: POST <code>${origin}/mcp</code> · Catalog: <a href="${CATALOG}/">${CATALOG}</a> (catalog <code>mesh_*</code> + FragGate <code>slug=mesh</code>)</p>
<p>Suite mesh: <code>GET ${origin}/v1/mesh</code> PROXY to aziel-runtime. Default OFF. QNM-BUILD-1.0 live|locked|isolated. No Node Gate. No auto-heal. Not anonymity. Author: Aziel Eliab only.</p>
<pre>curl -A Mozilla/5.0 ${origin}/v1/health
curl -A Mozilla/5.0 ${origin}/v1/skill
curl -A Mozilla/5.0 ${origin}/v1/mesh
curl -A Mozilla/5.0 -X POST ${origin}/v1/append-preview -H 'content-type: application/json' \\
  -d '{"event":"desk closed","result":"logged","owner_named":"records desk","confidence":0.7}'
curl -A Mozilla/5.0 -X POST ${origin}/v1/verify-canonical -H 'content-type: application/json' \\
  -d '{"canonical":"{...}"}'</pre>
<p>GET/POST under <code>/v1</code> never increment the download counter. Hosted never stores xlsx.</p>
<p><a href="/">Downloads</a></p>
</body></html>`;
}

function mcpTools() {
  return [
    { name: "employeelock_health", description: "Liveness. Does not increment download KV.", inputSchema: { type: "object" } },
    {
      name: "employeelock_append-preview",
      description: "Hash a proposed LOG row without writing a file. Hosted never stores xlsx. Not a court. Not UL. Not a truth score.",
      inputSchema: { type: "object", additionalProperties: true },
    },
    {
      name: "employeelock_verify-canonical",
      description: "Recompute SHA-256 of posted canonical JSON or fields.",
      inputSchema: { type: "object", additionalProperties: true },
    },
    {
      name: "employeelock_skill",
      description: "Return EmployeeLock skill markdown. Does not increment downloads or views.",
      inputSchema: { type: "object" },
    },
  ];
}

async function handleMcp(request) {
  if (request.method === "GET") {
    return json({
      ok: true,
      transport: "JSON-RPC MCP-over-HTTP",
      endpoint: "POST /mcp",
      methods: ["initialize", "tools/list", "tools/call", "ping"],
      auth: "none (public)",
      limitation: LIMITATION,
    });
  }
  if (request.method !== "POST") return json({ error: "POST JSON-RPC to /mcp" }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const id = body && body.id !== undefined ? body.id : null;
  const method = body && body.method;
  const params = (body && body.params) || {};
  const result = (value) => json({ jsonrpc: "2.0", id, result: value });
  if (method === "initialize") {
    return result({
      protocolVersion: PROTOCOL,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: PRODUCT, version: VERSION },
      instructions: LIMITATION,
    });
  }
  if (method === "notifications/initialized" || method === "initialized") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (method === "ping") return result({});
  if (method === "tools/list") return result({ tools: mcpTools() });
  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || params.input || {};
    let payload;
    if (name === "employeelock_health") {
      payload = { ok: true, product: PRODUCT, version: VERSION, kv_increment: false, stored: false, limitation: LIMITATION };
    } else if (name === "employeelock_append-preview") {
      payload = await appendPreview(args);
    } else if (name === "employeelock_verify-canonical") {
      payload = await verifyCanonical(args);
    } else if (name === "employeelock_skill") {
      payload = { markdown: SKILL, kv_increment: false, stored: false, limitation: LIMITATION };
    } else {
      payload = { error: "unknown tool", name };
    }
    return result({ content: [{ type: "text", text: JSON.stringify(payload) }], isError: Boolean(payload.error) });
  }
  return json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
}

export async function handleRuntimeApi(request, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/v1/mesh" || path.startsWith("/v1/mesh/")) return null;
  if (path === "/mcp") return handleMcp(request);
  if (path === "/v1/skill" && request.method === "GET") {
    return new Response(SKILL, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "private, no-store",
        ...corsHeaders(),
      },
    });
  }
  if (path === "/v1/health" && request.method === "GET") {
    return json({
      ok: true,
      product: PRODUCT,
      version: VERSION,
      spec: SPEC,
      runtime: true,
      kv_increment: false,
      stored: false,
      limitation: LIMITATION,
      catalog: CATALOG,
      author: "Aziel Eliab",
      mesh: meshPointer(),
    });
  }
  if ((path === "/v1/example" || path === "/v1/example/") && (request.method === "GET" || request.method === "HEAD")) {
    return json({
      ok: true,
      product: PRODUCT,
      author: "Aziel Eliab",
      example: EXAMPLE_PAYLOAD,
      note: "Sample payload only. Does not increment downloads.",
    });
  }

  if (path === "/openapi.json" && request.method === "GET") {
    return json(openapiSpec(originOf(request)));
  }
  if ((path === "/ai" || url.pathname === "/ai/") && request.method === "GET") {
    return html(aiHtml(originOf(request)));
  }
  if (path === "/v1/append-preview" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON body required", limitation: LIMITATION }, 400);
    }
    return json(await appendPreview(body));
  }
  if (path === "/v1/verify-canonical" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON body required", limitation: LIMITATION }, 400);
    }
    return json(await verifyCanonical(body));
  }
  if (path.startsWith("/v1/") || path === "/v1") {
    return json({ error: "not found", hint: "GET /v1/health  GET /v1/skill  POST /v1/append-preview  POST /v1/verify-canonical  GET /v1/mesh", limitation: LIMITATION }, 404);
  }
  return null;
}

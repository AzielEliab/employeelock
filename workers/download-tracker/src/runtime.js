/**
 * EmployeeLock hosted runtime. Hash a proposed row; never store xlsx.
 * /v1 never touches DOWNLOADS KV.
 */
const PRODUCT = "employeelock";
const VERSION = "0.1.0";
const SPEC = "employeelock-v0";
const HOST = "https://employeelock-download-tracker.vibelock.workers.dev";
const CATALOG = "https://aziel-runtime.vibelock.workers.dev";
const GENESIS_PREV = "0".repeat(64);
const CONF_PLACEHOLDER = "__EL_CONFIDENCE__";
const PROTOCOL = "2025-03-26";
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, mcp-session-id",
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
      description: LIMITATION,
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
      contact: { name: "Aziel Eliab", url: "https://github.com/AzielEliab/employeelock" },
    },
    servers: [{ url: origin }],
    paths: {
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
<p>OpenAPI: <a href="${origin}/openapi.json">${origin}/openapi.json</a></p>
<p>MCP: POST <code>${origin}/mcp</code> · Catalog: <a href="${CATALOG}/">${CATALOG}</a></p>
<pre>curl -A Mozilla/5.0 ${origin}/v1/health
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
    } else {
      payload = { error: "unknown tool", name };
    }
    return result({ content: [{ type: "text", text: JSON.stringify(payload) }], isError: Boolean(payload.error) });
  }
  return json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
}

export async function handleRuntimeApi(request, url) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/mcp") return handleMcp(request);
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
    return json({ error: "not found", hint: "GET /v1/health  POST /v1/append-preview  POST /v1/verify-canonical", limitation: LIMITATION }, 404);
  }
  return null;
}

---
name: EmployeeLock
description: Use when an assistant should log an accountability row or verify an EmployeeLock workbook via hosted /v1 (append-preview, verify-canonical) or aziel-runtime.
---

# EmployeeLock

Hash-chained accountability workbook. Local CLI + sheet. Author: **Aziel Eliab**.

**THIS IS:** workbook + hash chain (COVER, LOG, EVIDENCE, CHAIN, OWNERS, DASH, LISTS) + CLI (init / append / import / verify / ui / doctor).

**THIS IS NOT:** a court filing, exhibit stickerer, counsel, UL or BAL paper, truth score, consensus, token, remote uploader, or a charge sheet. Hosted `/v1` never stores xlsx.

Honest banner: workbook + hash chain, not a court.

Always send `User-Agent: Mozilla/5.0`. Cloudflare Workers may 403 an empty agent.

## Call these URLs

- Worker OpenAPI: https://employeelock-download-tracker.vibelock.workers.dev/openapi.json
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`
- Live skill (this markdown): `GET https://employeelock-download-tracker.vibelock.workers.dev/v1/skill`

Ops (do **not** increment downloads or views):

- `POST /v1/append-preview` — hash a proposed LOG row; nothing is stored
- `POST /v1/verify-canonical` — recompute SHA-256 of posted canonical JSON or fields
- `GET /v1/health`
- `GET /v1/skill` — this file

Catalog aliases: `POST /p/employeelock/append-preview`, `POST /p/employeelock/verify-canonical`, `GET /p/employeelock/skill`.

MCP tools: `employeelock_append-preview`, `employeelock_verify-canonical`, `employeelock_health`, `employeelock_skill`.

Grok: import OpenAPI as a custom tool. ChatGPT: GPT Actions. Venice: HTTP tools.

## Kid-plain field names

Use these. The hosted API also accepts the long hashed names.

| kid-plain | hashed field | meaning |
|-----------|--------------|---------|
| event | event | what happened |
| result | result | what followed |
| blame | blame_placed | who is responsible, or blank |
| owner | owner_named | who owns the record. blank → UNOWNED |
| short | outcome_short | near effect |
| long | outcome_long | lasting effect |

Blank `owner` flags **UNOWNED**. Filled `renamed_from` flags **RENAMED**. `confidence` is observer-assigned (not a truth score). Path B: append only; do not rewrite a hashed cell. A later long outcome is a new row that cites the old `row_hash`.

## Example

```bash
curl -s -A 'Mozilla/5.0' https://employeelock-download-tracker.vibelock.workers.dev/v1/health
curl -s -A 'Mozilla/5.0' -X POST https://employeelock-download-tracker.vibelock.workers.dev/v1/append-preview \
  -H 'content-type: application/json' \
  -d '{"event":"desk closed","result":"logged","blame":"","owner":"records desk","short":"row added","long":"chain grew","confidence":0.7}'
curl -s -A 'Mozilla/5.0' https://aziel-runtime.vibelock.workers.dev/p/employeelock/skill
```

## Local (after one-click install)

```bash
curl -fsSL https://employeelock-download-tracker.vibelock.workers.dev/install.sh | bash
employeelock ui
employeelock doctor
python3 employeelock.py verify WORKBOOK.xlsx
```

Paper: EL-WP-0.1 · DOI https://doi.org/10.5281/zenodo.22257493 · Apache-2.0. Forks welcome.

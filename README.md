# EmployeeLock

Hash-chained accountability workbook. Local CLI + sheet. Not a court filing.

**Author:** Aziel Eliab
**Date:** 2 September 2026
**License:** [Apache-2.0](LICENSE)
**Version:** 0.1.0
**Spec:** `employeelock-v0`
**Paper:** EL-WP-0.1 — [docs/whitepaper.md](docs/whitepaper.md) · DOI [10.5281/zenodo.22257493](https://doi.org/10.5281/zenodo.22257493)

> Name the event. Name who owns the record. Keep leftover blame blank if it is blank. Chain the row.

**Forks are welcome and always allowed.**

## Honest scope

**THIS IS:** workbook (COVER, LOG, EVIDENCE, CHAIN, OWNERS, DASH, LISTS) + CLI (init/append/import/verify) + linear hash chain + countermeasure against unowned/renamed rows.

**THIS IS NOT:** UL or a BAL issue paper; FoldLock; TemporalLock (borrows ethic, different product); court filing / exhibit stickerer / counsel; truth score / consensus / token; remote uploader / anonymous relay; a charge sheet against a named living person.

Demo rows are generic format proof (`records desk` / unnamed prior process), not case facts. Do not put a legal name or home location in the template.

## One-click install

```bash
curl -fsSL https://employeelock-download-tracker.vibelock.workers.dev/install.sh | bash
```

The script curls the **counted** tarball from this project's Worker
(`/download`, User-Agent `Mozilla/5.0`), extracts, makes a venv, and
`pip install -e .`. Then run `employeelock ui`.

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"
python3 employeelock.py init WORKBOOK.xlsx
employeelock ui
```

Open http://127.0.0.1:8871 (loopback only). No CDN, no telemetry.

Self-check: `employeelock doctor`.

## Counted download (Cloudflare Worker)

**This is the counted download.** GitHub releases exist as a mirror.
The Worker serves the gzip itself (HTTP 200, no 302 to GitHub).

# → [https://employeelock-download-tracker.vibelock.workers.dev/](https://employeelock-download-tracker.vibelock.workers.dev/) ←

Direct tarball (also counted):
[employeelock-0.1.0.tar.gz](https://employeelock-download-tracker.vibelock.workers.dev/download?asset=employeelock-0.1.0.tar.gz)

- Live count JSON: [https://employeelock-download-tracker.vibelock.workers.dev/stats](https://employeelock-download-tracker.vibelock.workers.dev/stats)
- OpenAPI: [https://employeelock-download-tracker.vibelock.workers.dev/openapi.json](https://employeelock-download-tracker.vibelock.workers.dev/openapi.json)
- GitHub: [https://github.com/AzielEliab/employeelock](https://github.com/AzielEliab/employeelock)

Isolated counter: Worker `employeelock-download-tracker`, KV `EMPLOYEELOCK_DOWNLOADS`. Not mixed with any other product. `/v1` does not increment downloads.

## CLI

```bash
python3 employeelock.py init WORKBOOK.xlsx
python3 employeelock.py append WORKBOOK.xlsx \
  --event TEXT --result TEXT --blame TEXT --owner TEXT \
  --short TEXT --long TEXT [--renamed-from TEXT] [--cites HASH] \
  [--confidence 0.7] [--observer operator] [--exhibit Y|N|maybe]
python3 employeelock.py import WORKBOOK.xlsx FILE [FILE ...] \
  --event TEXT --result TEXT --blame TEXT --owner TEXT \
  --short TEXT --long TEXT [--kind KIND] [--note TEXT]
python3 employeelock.py verify WORKBOOK.xlsx
employeelock ui
employeelock doctor
```

`verify` prints `{ok, rows, errors, missing_files, unowned}`. Exit 0 if
the chain hashes. Missing files are reported and do not by themselves
fail `ok`.

v0 has **no** `--copy-to`. The workbook does not embed media.

## How it works

Each LOG row is SHA-256 of canonical UTF-8 JSON (sorted keys, compact
separators). `confidence` is forced to six decimal places. Genesis
`prev_hash` is 64 ASCII zeros. Hashed fields only:

`entry_id, timestamp, event, result, blame_placed, owner_named,
renamed_from, outcome_short, outcome_long, evidence_ids, confidence,
observer, file_sha256s, prev_hash`

Blank `owner_named` → formula flag **UNOWNED**. Filled `renamed_from` →
**RENAMED**. Path B: the CLI appends; it never rewrites hashed cells.
A later long outcome is a new row that cites the old `row_hash`.

Unowned Lattice (UL / BAL) is the issue cluster this tool is built to
fight. This product is **not** filed under UL-CAT and does not replace
BAL papers.

## Local UI

`employeelock ui` serves a loopback dashboard at http://127.0.0.1:8871

Buttons: New workbook, Add row, Add file (import), Export, Verify,
Doctor, Sample. Simple / Advanced views. Shows UNOWNED / RENAMED /
chain OK counts. Import/export JSON receipts. Binds `127.0.0.1` only.

## iPhone & Android

Flutter sources: [`mobile/`](mobile/). Application id
`com.azieeliab.employeelock`. Offline. No analytics. Dark matte / gold.
Not a store listing. Not a separate repo.

```bash
cd mobile
flutter create --org com.azieeliab --project-name employeelock .
flutter pub get
flutter run
```

## Hosted `/v1`

The Worker hosts a **stateless** preview API. It never stores xlsx.

- `GET /v1/health`
- `GET /v1/skill` — skill markdown (not counted)
- `POST /v1/append-preview` — hash a proposed row without writing a file
- `POST /v1/verify-canonical` — recompute hash of posted canonical
- OpenAPI: `/openapi.json`
- MCP: catalog `https://aziel-runtime.vibelock.workers.dev/mcp` and this Worker `/mcp`

Banner: not a court, not UL, not a truth score.

## For AI assistants (Grok / ChatGPT / Venice)

Import OpenAPI or MCP. This repo also ships [`SKILL.md`](SKILL.md) so an assistant can log or verify a row.

- Skill (repo): [`SKILL.md`](SKILL.md)
- Skill (live markdown, not counted): [GET /v1/skill](https://employeelock-download-tracker.vibelock.workers.dev/v1/skill)
- Worker OpenAPI: https://employeelock-download-tracker.vibelock.workers.dev/openapi.json
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`

Send `User-Agent: Mozilla/5.0`. Hosted never stores xlsx. Kid-plain fields: event, result, blame, owner, short, long.

Counted download (same Worker, gzip HTTP 200, no 302):
[employeelock-0.1.0.tar.gz](https://employeelock-download-tracker.vibelock.workers.dev/download?asset=employeelock-0.1.0.tar.gz)

## Papers

See [docs/whitepaper.md](docs/whitepaper.md) (EL-WP-0.1).

- Paper (PDF): [EmployeeLock_EL-WP-0.1.pdf](https://zenodo.org/records/22257493)
- DOI: [https://doi.org/10.5281/zenodo.22257493](https://doi.org/10.5281/zenodo.22257493)
- Zenodo record: [https://zenodo.org/records/22257493](https://zenodo.org/records/22257493)
- License: Apache-2.0. Creator: Eliab, Aziel.

## Mesh (siblings, not this product)

| Sibling | Boundary |
|---------|----------|
| FoldLock | Compress / decompress. EmployeeLock may index a `.fld` as a file. It does not fold. |
| TemporalLock | Time receipts. EmployeeLock is a row chain about events and owners. |
| ForgeReceipts | Packaging. A verified workbook can be a payload. |
| GodLock | Public ABAD node. Not this sheet. |
| UL / BAL | Issue papers stay issue papers. EmployeeLock cites the cluster and refuses to be filed as UL. |

## Tests

```bash
python -m pytest -q
```

Covers genesis hash, second-row link, blank owner → UNOWNED,
renamed_from → RENAMED, verify catching an edited event, missing file
reported, import hashing file bytes.

## Use with Grok / ChatGPT / Venice

Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
Catalog MCP: `POST https://aziel-runtime.vibelock.workers.dev/mcp`
This Worker skill: https://employeelock-download-tracker.vibelock.workers.dev/v1/skill
This Worker OpenAPI: https://employeelock-download-tracker.vibelock.workers.dev/openapi.json

Grok: import the catalog or Worker OpenAPI as a custom tool. ChatGPT: GPT Actions (no auth). Venice: HTTP tools. Always send `User-Agent: Mozilla/5.0`.

## Cite this

Aziel Eliab. EmployeeLock. https://github.com/AzielEliab/employeelock. https://employeelock-download-tracker.vibelock.workers.dev. https://doi.org/10.5281/zenodo.22257493.

- Catalog: https://aziel-runtime.vibelock.workers.dev/
- Worker homepage: https://employeelock-download-tracker.vibelock.workers.dev/
- Counted download (gzip HTTP 200, no 302): https://employeelock-download-tracker.vibelock.workers.dev/download
- GitHub: https://github.com/AzielEliab/employeelock
- Citation JSON: https://employeelock-download-tracker.vibelock.workers.dev/cite.json
- DOI: https://doi.org/10.5281/zenodo.22257493

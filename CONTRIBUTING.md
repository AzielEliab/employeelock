# Contributing to EmployeeLock

**Forks are first-class.** This project is Apache-2.0; you do not need
permission to fork, patch, or redistribute.

**Forks are welcome and always allowed.**

## How to run tests

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest -q
```

Python 3.10+. Runtime needs `openpyxl`. pytest is the dev extra.
No network. No ML.

## Ground rules

1. **Not a court.** Do not add exhibit numbers, counsel features, or
   filing uploaders. Demo rows stay generic format proof.
2. **Not UL / BAL.** EmployeeLock fights the unowned/renamed surface
   and refuses to be filed under UL-CAT.
3. **Not a truth score.** `confidence` is observer-assigned. verify
   recomputes hashes. It does not decide who was right.
4. **Path B.** The CLI appends. It does not rewrite a prior row's
   hashed fields. A later long outcome is a new row that cites the old
   `row_hash`.
5. **UI binds loopback only** (`127.0.0.1:8871`). Do not listen on
   `0.0.0.0`. No telemetry. No CDN.
6. **Do not mix the download tracker** with any other product's Worker
   or KV. Namespace `EMPLOYEELOCK_DOWNLOADS` only.
7. **Public identity is Aziel Eliab.** Do not add GodLock.AZ as an
   identity label. GodLock is a sibling product name in the mesh.
8. **Door vs local op.** `/v1/mesh/*` PROXY to aziel-runtime. Local ops are `/v1/{op}` only.
   Suite mesh default OFF; QNM rollup live|locked|isolated; QNS-CD-1.0 photon QNS1 cross-map (not Softwares-tab; no public qnsd proxy); no Node Gate;
   no auto-heal; not anonymity.
9. New behavior needs a test that fails without the change.
10. Canonical JSON: UTF-8, sorted keys, compact separators, confidence
   forced to six decimal places. Genesis `prev_hash` is 64 ASCII zeros.

## Where to change things

- Hash / workbook / verify: `employeelock/engine.py`
- CLI: `employeelock/cli.py`
- Doctor: `employeelock/doctor.py`
- Local UI: `employeelock/ui.py`, `employeelock/web/`
- Spec: `docs/whitepaper.md`
- Flutter: `mobile/`
- Isolated counter: `workers/download-tracker/`
- Suite mesh / QNM Live Nodes: `workers/download-tracker/src/mesh.js` (`/v1/mesh/*` PROXY to aziel-runtime; QNS-CD-1.0 cross-map cite).

## License of contributions

By submitting a change you agree it is licensed under Apache-2.0, the
same license as the rest of the tree. Keep the copyright lines honest.
Ship as Aziel Eliab.

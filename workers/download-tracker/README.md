# employeelock download tracker

Isolated Worker `employeelock-download-tracker`. Project `employeelock`.
KV namespace `EMPLOYEELOCK_DOWNLOADS` bound as `DOWNLOADS`.
Does **not** 302 to GitHub on `/download`. Serves gzip via `ASSETS.fetch`,
`Cache-Control: private, no-store`.

GET `/` increments a **page-view** counter (separate from downloads).
GET `/download` increments **downloads**.
`/v1` never increments DOWNLOADS KV.

Host: https://employeelock-download-tracker.vibelock.workers.dev

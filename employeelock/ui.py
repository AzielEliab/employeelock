"""Local EmployeeLock UI. Bind 127.0.0.1:8871 only.

Buttons: New workbook, Add row, Add file, Export, Verify, Doctor, Sample.
Simple / Advanced views. UNOWNED / RENAMED / chain OK counts.
Import/export receipts (json). No CDN, no telemetry. Loopback only.
"""

from __future__ import annotations

import json
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.resources import files
from pathlib import Path
from urllib.parse import urlparse

from employeelock.engine import (
    ENGINE_VERSION,
    LIMITATION,
    append_row,
    dash_counts,
    import_files,
    init_workbook,
    list_rows,
    verify_workbook,
)

LOOPBACK = frozenset({"127.0.0.1", "localhost", "::1"})
WEB = files("employeelock") / "web"
MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".json": "application/json; charset=utf-8",
}
MAX_BODY_BYTES = 8 * 1024 * 1024

_STATE: dict[str, Path | None] = {"workbook": None, "tmpdir": None}


def _ensure_workbook() -> Path:
    if _STATE["workbook"] is None or not Path(str(_STATE["workbook"])).is_file():
        tmp = Path(tempfile.mkdtemp(prefix="employeelock-ui-"))
        _STATE["tmpdir"] = tmp
        dest = tmp / "EmployeeLock_v0.xlsx"
        init_workbook(dest, demo=True)
        _STATE["workbook"] = dest
    return Path(str(_STATE["workbook"]))


def _web_bytes(name: str) -> bytes:
    return (WEB / name).read_bytes()


def _receipt(path: Path) -> dict:
    report = verify_workbook(path)
    rows = list_rows(path)
    counts = dash_counts(path)
    return {
        "product": "employeelock",
        "version": ENGINE_VERSION,
        "workbook": str(path),
        "limitation": LIMITATION,
        "verify": {
            "ok": report["ok"],
            "rows": report["rows"],
            "errors": report["errors"],
            "missing_files": report["missing_files"],
            "unowned": report["unowned"],
        },
        "counts": counts,
        "rows": [
            {
                "entry_id": r["entry_id"],
                "timestamp": r["timestamp"],
                "event": r["event"],
                "result": r["result"],
                "blame_placed": r["blame_placed"],
                "owner_named": r["owner_named"],
                "unowned": r["unowned"],
                "renamed_from": r["renamed_from"],
                "name_moved": r["name_moved"],
                "outcome_short": r["outcome_short"],
                "outcome_long": r["outcome_long"],
                "cites": r["cites"],
                "confidence": r["confidence"],
                "observer": r["observer"],
                "exhibit_potential": r["exhibit_potential"],
                "evidence_ids": r["evidence_ids"],
                "file_sha256s": r["file_sha256s"],
                "prev_hash": r["prev_hash"],
                "row_hash": r["row_hash"],
            }
            for r in rows
        ],
    }


class Handler(BaseHTTPRequestHandler):
    server_version = f"EmployeeLock/{ENGINE_VERSION}"

    def log_message(self, fmt: str, *args: object) -> None:
        return

    def _send(self, status: int, body: bytes, content_type: str, filename: str | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, obj: object) -> None:
        body = json.dumps(obj, indent=2, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _read_body(self) -> bytes | None:
        try:
            length = int(self.headers.get("Content-Length") or "0")
        except ValueError:
            self._json(400, {"error": "invalid Content-Length"})
            return None
        if length < 0:
            self._json(400, {"error": "invalid Content-Length"})
            return None
        if length > MAX_BODY_BYTES:
            self._json(413, {"error": "payload too large", "limit": MAX_BODY_BYTES, "limitation": LIMITATION})
            return None
        return self.rfile.read(length) if length else b"{}"

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in {"/", "/index.html"}:
            self._send(200, _web_bytes("index.html"), MIME[".html"])
            return
        if path == "/style.css":
            self._send(200, _web_bytes("style.css"), MIME[".css"])
            return
        if path == "/app.js":
            self._send(200, _web_bytes("app.js"), MIME[".js"])
            return
        if path == "/api/health":
            wb = _ensure_workbook()
            self._json(
                200,
                {
                    "ok": True,
                    "version": ENGINE_VERSION,
                    "loopback": True,
                    "telemetry": False,
                    "workbook": str(wb),
                    "limitation": LIMITATION,
                },
            )
            return
        if path == "/api/state":
            wb = _ensure_workbook()
            self._json(200, _receipt(wb))
            return
        if path == "/api/download.xlsx":
            wb = _ensure_workbook()
            self._send(200, wb.read_bytes(), MIME[".xlsx"], "EmployeeLock_v0.xlsx")
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        allowed = {
            "/api/new",
            "/api/append",
            "/api/import",
            "/api/sample",
            "/api/verify",
            "/api/export",
            "/api/doctor",
            "/api/upload-workbook",
        }
        if path not in allowed:
            self._json(404, {"error": "not found"})
            return
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        raw = self._read_body()
        if raw is None:
            return

        if path == "/api/new":
            tmp = Path(tempfile.mkdtemp(prefix="employeelock-ui-"))
            dest = tmp / "EmployeeLock_v0.xlsx"
            init_workbook(dest, demo=False)
            _STATE["tmpdir"] = tmp
            _STATE["workbook"] = dest
            self._json(200, _receipt(dest))
            return

        if path == "/api/sample":
            tmp = Path(tempfile.mkdtemp(prefix="employeelock-ui-"))
            dest = tmp / "EmployeeLock_v0.xlsx"
            init_workbook(dest, demo=True)
            _STATE["tmpdir"] = tmp
            _STATE["workbook"] = dest
            self._json(200, _receipt(dest))
            return

        if path == "/api/upload-workbook":
            dest_dir = Path(tempfile.mkdtemp(prefix="employeelock-ui-"))
            dest = dest_dir / "EmployeeLock_v0.xlsx"
            dest.write_bytes(raw)
            _STATE["tmpdir"] = dest_dir
            _STATE["workbook"] = dest
            self._json(200, _receipt(dest))
            return

        wb = _ensure_workbook()

        if path == "/api/verify":
            self._json(200, _receipt(wb))
            return

        if path == "/api/export":
            receipt = _receipt(wb)
            self._json(
                200,
                {
                    "receipt": receipt,
                    "filename": "employeelock-receipt.json",
                    "limitation": LIMITATION,
                },
            )
            return

        if path == "/api/doctor":
            from employeelock.doctor import run_doctor
            import io
            from contextlib import redirect_stdout

            buf = io.StringIO()
            with redirect_stdout(buf):
                code = run_doctor(as_json=True)
            text = buf.getvalue()
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                payload = {"ok": code == 0, "raw": text}
            payload["exit"] = code
            self._json(200, payload)
            return

        if path == "/api/import":
            # multipart is not required: JSON {event,..., files:[{name, bytes_b64}]} or a saved path list.
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self._json(400, {"error": "JSON body required"})
                return
            files_meta = payload.get("files") or []
            saved: list[Path] = []
            tmp = Path(str(_STATE["tmpdir"] or tempfile.mkdtemp(prefix="employeelock-ui-")))
            import base64

            for item in files_meta:
                name = str(item.get("name") or "upload.bin")
                data = item.get("b64") or item.get("bytes_b64") or ""
                try:
                    blob = base64.b64decode(data)
                except Exception as exc:  # noqa: BLE001
                    self._json(400, {"error": f"bad base64: {exc}"})
                    return
                dest = tmp / name
                dest.write_bytes(blob)
                saved.append(dest)
            if not saved:
                self._json(400, {"error": "files required"})
                return
            rec = import_files(
                wb,
                saved,
                event=str(payload.get("event") or ""),
                result=str(payload.get("result") or ""),
                blame=str(payload.get("blame") or payload.get("blame_placed") or ""),
                owner=str(payload.get("owner") or payload.get("owner_named") or ""),
                short=str(payload.get("short") or payload.get("outcome_short") or ""),
                long=str(payload.get("long") or payload.get("outcome_long") or ""),
                renamed_from=str(payload.get("renamed_from") or ""),
                cites=str(payload.get("cites") or ""),
                confidence=float(payload.get("confidence") or 0.7),
                observer=str(payload.get("observer") or "operator"),
                exhibit=str(payload.get("exhibit") or "N"),
                kind=payload.get("kind"),
                note=str(payload.get("note") or ""),
            )
            out = _receipt(wb)
            out["last"] = rec
            self._json(200, out)
            return

        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "JSON body required"})
            return
        if not isinstance(payload, dict):
            self._json(400, {"error": "JSON object required"})
            return

        if path == "/api/append":
            rec = append_row(
                wb,
                event=str(payload.get("event") or ""),
                result=str(payload.get("result") or ""),
                blame=str(payload.get("blame") or payload.get("blame_placed") or ""),
                owner=str(payload.get("owner") or payload.get("owner_named") or ""),
                short=str(payload.get("short") or payload.get("outcome_short") or ""),
                long=str(payload.get("long") or payload.get("outcome_long") or ""),
                renamed_from=str(payload.get("renamed_from") or ""),
                cites=str(payload.get("cites") or ""),
                confidence=float(payload.get("confidence") or 0.7),
                observer=str(payload.get("observer") or "operator"),
                exhibit=str(payload.get("exhibit") or "N"),
            )
            out = _receipt(wb)
            out["last"] = rec
            self._json(200, out)
            return

        self._json(404, {"error": "not found"})


def make_server(host: str = "127.0.0.1", port: int = 8871) -> ThreadingHTTPServer:
    if host not in LOOPBACK:
        raise ValueError("EmployeeLock UI binds loopback only (127.0.0.1)")
    return ThreadingHTTPServer((host, port), Handler)


def serve(host: str = "127.0.0.1", port: int = 8871) -> None:
    httpd = make_server(host, port)
    bound_host, bound_port = httpd.server_address[:2]
    print(
        f"EmployeeLock UI http://{bound_host}:{bound_port} "
        "(loopback only; not a court; not UL; not a truth score)"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    finally:
        httpd.server_close()

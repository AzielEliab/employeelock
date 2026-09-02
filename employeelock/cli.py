"""Command-line interface for EmployeeLock.

    python3 employeelock.py init WORKBOOK.xlsx
    python3 employeelock.py append WORKBOOK.xlsx --event TEXT --result TEXT ...
    python3 employeelock.py import WORKBOOK.xlsx FILE [FILE ...] --event TEXT ...
    python3 employeelock.py verify WORKBOOK.xlsx
    employeelock ui
    employeelock doctor
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Sequence

from employeelock import __version__
from employeelock.engine import (
    LIMITATION,
    append_row,
    import_files,
    init_workbook,
    verify_workbook,
)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="employeelock",
        description=(
            "EmployeeLock — hash-chained accountability workbook (Aziel Eliab, 2026). "
            "Local CLI + sheet. Not a court filing. Not UL. Not a truth score. "
            "Local UI: `employeelock ui` at http://127.0.0.1:8871."
        ),
        epilog=LIMITATION,
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="Build a fresh workbook (two generic demo rows).")
    p_init.add_argument("workbook")
    p_init.add_argument("--no-demo", action="store_true", help="Skip shipped demo rows.")

    def _row_flags(p: argparse.ArgumentParser) -> None:
        p.add_argument("--event", required=True, help="What happened.")
        p.add_argument("--result", required=True, help="What followed.")
        p.add_argument("--blame", default="", help="Responsible name or blank.")
        p.add_argument("--owner", default="", help="Owner of the record. Blank flags UNOWNED.")
        p.add_argument("--short", default="", help="Near effect (outcome_short).")
        p.add_argument("--long", default="", help="Lasting effect (outcome_long).")
        p.add_argument("--renamed-from", default="", dest="renamed_from", help="Prior name, if any.")
        p.add_argument("--cites", default="", help="Prior row_hash when this row extends an older one.")
        p.add_argument("--confidence", type=float, default=0.7, help="Observer-assigned 0.0–1.0.")
        p.add_argument("--observer", default="operator", help="operator | witness | system | third-party.")
        p.add_argument("--exhibit", default="N", help="Y | N | maybe. Not an exhibit number.")

    p_append = sub.add_parser("append", help="Write a LOG row with no files.")
    p_append.add_argument("workbook")
    _row_flags(p_append)

    p_import = sub.add_parser("import", help="One LOG row plus one EVIDENCE row per file.")
    p_import.add_argument("workbook")
    p_import.add_argument("files", nargs="+", metavar="FILE")
    _row_flags(p_import)
    p_import.add_argument("--kind", default=None, help="Override kind guess from suffix.")
    p_import.add_argument("--note", default="", help="Optional evidence note.")

    p_verify = sub.add_parser("verify", help="Recompute hashes. Missing files are reported, not a chain break.")
    p_verify.add_argument("workbook")

    p_ui = sub.add_parser("ui", help="Serve the local UI on 127.0.0.1:8871 (loopback only).")
    p_ui.add_argument("--host", default="127.0.0.1", help="Loopback host (default 127.0.0.1).")
    p_ui.add_argument("--port", type=int, default=8871, help="Port (default 8871).")

    p_doc = sub.add_parser("doctor", help="Self-check: engine, loopback, hash chain, import.")
    p_doc.add_argument("--json", action="store_true", dest="as_json", help="Print doctor results as JSON.")

    sub.add_parser("version", help="Print package version.")
    return parser


def _print_json(obj: object) -> None:
    sys.stdout.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.cmd == "version":
        print(f"employeelock {__version__}")
        return 0

    if args.cmd == "doctor":
        from employeelock.doctor import run_doctor

        return run_doctor(as_json=args.as_json)

    if args.cmd == "ui":
        from employeelock.ui import serve

        serve(host=args.host, port=args.port)
        return 0

    if args.cmd == "init":
        path = init_workbook(args.workbook, demo=not args.no_demo)
        print(f"wrote {path}")
        print(LIMITATION)
        return 0

    if args.cmd == "append":
        rec = append_row(
            args.workbook,
            event=args.event,
            result=args.result,
            blame=args.blame,
            owner=args.owner,
            short=args.short,
            long=args.long,
            renamed_from=args.renamed_from,
            cites=args.cites,
            confidence=args.confidence,
            observer=args.observer,
            exhibit=args.exhibit,
        )
        _print_json(rec)
        return 0

    if args.cmd == "import":
        rec = import_files(
            args.workbook,
            args.files,
            event=args.event,
            result=args.result,
            blame=args.blame,
            owner=args.owner,
            short=args.short,
            long=args.long,
            renamed_from=args.renamed_from,
            cites=args.cites,
            confidence=args.confidence,
            observer=args.observer,
            exhibit=args.exhibit,
            kind=args.kind,
            note=args.note,
        )
        _print_json(rec)
        return 0

    if args.cmd == "verify":
        report = verify_workbook(args.workbook)
        public = {
            "ok": report["ok"],
            "rows": report["rows"],
            "errors": report["errors"],
            "missing_files": report["missing_files"],
            "unowned": report["unowned"],
        }
        _print_json(public)
        return 0 if report["ok"] else 1

    parser.error(f"unknown command {args.cmd}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

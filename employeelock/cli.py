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
import re
import sys
import zipfile
from typing import Sequence

from openpyxl.utils.exceptions import InvalidFileException

from employeelock import __version__
from employeelock.engine import append_row, import_files, init_workbook, verify_workbook

WELCOME = """\
EmployeeLock keeps a local workbook of what happened, what followed, and who owns each record.

Start here:
  employeelock ui
  Open http://127.0.0.1:8871/

Or from the terminal:
  employeelock init WORKBOOK.xlsx
  employeelock doctor

Author: Aziel Eliab
"""

ROOT_HELP = """\
EmployeeLock — local workbook of events, results, and owners.

Usage:
  employeelock
  employeelock <command> [options]

Common commands:
  ui                       Open the workbook at http://127.0.0.1:8871/
  init FILE                Create a workbook (two demo rows)
  append FILE              Add a row (--event and --result required)
  import FILE PATH...      Add a row and hash each file
  verify FILE              Check the hash chain
  doctor                   Check this install
  version                  Print the version

Examples:
  employeelock ui
  employeelock init WORKBOOK.xlsx
  employeelock append WORKBOOK.xlsx --event "desk closed" --result "logged" --owner "records desk"
  employeelock verify WORKBOOK.xlsx
  employeelock doctor

Add --json for machine-readable output (append, import, verify, doctor, init, version).

Advanced:
  init --no-demo
  append / import flags: --blame --owner --short --long --renamed-from --cites
                         --confidence --observer --exhibit
  import flags: --kind --note
  ui --host 127.0.0.1 --port 8871

Author: Aziel Eliab
"""


class EmployeeParser(argparse.ArgumentParser):
    def format_help(self) -> str:
        if getattr(self, "is_root", False):
            return ROOT_HELP
        return super().format_help()

    def error(self, message: str) -> None:
        if getattr(self, "is_root", False) and "required: cmd" in message:
            sys.stdout.write(WELCOME)
            self.exit(0)
        self.exit(2, _plain_error(self.prog, message) + "\n")


def _plain_error(prog: str, message: str) -> str:
    choice = re.search(r"invalid choice: '([^']*)'", message)
    if choice and prog.strip() in {"employeelock", "employeelock.py"}:
        name = choice.group(1)
        return f'Unknown command "{name}". Try: employeelock ui   or   employeelock --help'
    if "required:" in message and "workbook" in message and ("--event" in message or "--result" in message):
        return (
            "A workbook path, --event, and --result are required.\n"
            'Next: employeelock append WORKBOOK.xlsx --event "what happened" --result "what followed"'
        )
    if "required:" in message and ("--event" in message or "--result" in message):
        return (
            "Add --event and --result.\n"
            'Next: employeelock append WORKBOOK.xlsx --event "what happened" --result "what followed"'
        )
    if "required:" in message and "workbook" in message:
        return "A workbook path is required.\nNext: employeelock init WORKBOOK.xlsx"
    if "required:" in message and "FILE" in message:
        return "Name at least one file to import.\nNext: employeelock import WORKBOOK.xlsx FILE --event \"what happened\" --result \"what followed\""
    if message.startswith("unrecognized arguments:"):
        extra = message.split(":", 1)[1].strip()
        return f'Unknown option "{extra}".\nNext: employeelock --help'
    if "invalid int value" in message:
        return "That number is not valid.\nNext: employeelock ui --port 8871"
    if "invalid float value" in message or "confidence" in message.lower():
        return "Confidence must be a number from 0.0 to 1.0.\nNext: add --confidence 0.7"
    return f"{message}\nNext: employeelock --help"


def _build_parser() -> EmployeeParser:
    parser = EmployeeParser(
        prog="employeelock",
        description="EmployeeLock — local workbook of events, results, and owners.",
    )
    parser.is_root = True
    sub = parser.add_subparsers(dest="cmd", required=False, parser_class=EmployeeParser)

    p_init = sub.add_parser("init", help="Create a workbook (two demo rows).")
    p_init.add_argument("workbook")
    p_init.add_argument("--no-demo", action="store_true", help="Skip the shipped demo rows.")

    def _row_flags(p: argparse.ArgumentParser) -> None:
        p.add_argument("--event", required=True, help="What happened.")
        p.add_argument("--result", required=True, help="What followed.")
        p.add_argument("--blame", default="", help="Who was named. Blank is allowed.")
        p.add_argument("--owner", default="", help="Who owns the record. Blank is stored as UNOWNED.")
        p.add_argument("--short", default="", help="What happened soon (outcome_short).")
        p.add_argument("--long", default="", help="What lasted (outcome_long).")
        p.add_argument("--renamed-from", default="", dest="renamed_from", help="Prior name, if any.")
        p.add_argument("--cites", default="", help="Prior row_hash when this row extends an older one.")
        p.add_argument("--confidence", type=float, default=0.7, help="Observer-assigned 0.0–1.0.")
        p.add_argument("--observer", default="operator", help="operator | witness | system | third-party.")
        p.add_argument("--exhibit", default="N", help="Y | N | maybe.")

    p_append = sub.add_parser("append", help="Add a row with no files.")
    p_append.add_argument("workbook")
    _row_flags(p_append)

    p_import = sub.add_parser("import", help="Add a row and hash each file.")
    p_import.add_argument("workbook")
    p_import.add_argument("files", nargs="+", metavar="FILE")
    _row_flags(p_import)
    p_import.add_argument("--kind", default=None, help="Override the kind guessed from the file suffix.")
    p_import.add_argument("--note", default="", help="Optional note stored with the file.")

    p_verify = sub.add_parser("verify", help="Check that each row still hashes.")
    p_verify.add_argument("workbook")

    p_ui = sub.add_parser("ui", help="Open the local workbook on 127.0.0.1:8871.")
    p_ui.add_argument("--host", default="127.0.0.1", help="Loopback host (default 127.0.0.1).")
    p_ui.add_argument("--port", type=int, default=8871, help="Port (default 8871).")

    p_doc = sub.add_parser("doctor", help="Check this install.")
    p_doc.add_argument("--json", action="store_true", dest="as_json", help="Print doctor results as JSON.")

    sub.add_parser("version", help="Print the version.")
    return parser


def _print_json(obj: object) -> None:
    sys.stdout.write(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def _fail(reason: str, nxt: str) -> int:
    sys.stderr.write(f"{reason}\nNext: {nxt}\n")
    return 2


def _guard(fn):
    try:
        return fn()
    except FileNotFoundError as exc:
        target = getattr(exc, "filename", None) or exc
        return _fail(
            f"File not found: {target}",
            "check the path, or run employeelock init WORKBOOK.xlsx",
        )
    except ValueError as exc:
        text = str(exc)
        if "confidence" in text:
            return _fail(text, "use --confidence between 0.0 and 1.0")
        return _fail(text, "employeelock --help")
    except (OSError, KeyError, InvalidFileException, zipfile.BadZipFile) as exc:
        return _fail(
            f"Could not read that workbook ({exc}).",
            "employeelock init WORKBOOK.xlsx",
        )


def _split_json(argv: Sequence[str]) -> tuple[list[str], bool]:
    as_json = False
    kept: list[str] = []
    for arg in argv:
        if arg == "--json":
            as_json = True
        else:
            kept.append(arg)
    return kept, as_json


def main(argv: Sequence[str] | None = None) -> int:
    raw = list(sys.argv[1:] if argv is None else argv)
    raw, as_json = _split_json(raw)
    parser = _build_parser()
    args = parser.parse_args(raw)

    if args.cmd is None:
        sys.stdout.write(WELCOME)
        return 0

    if args.cmd == "version":
        if as_json:
            _print_json({"name": "employeelock", "version": __version__})
        else:
            print(f"employeelock {__version__}")
        return 0

    if args.cmd == "doctor":
        from employeelock.doctor import run_doctor

        return run_doctor(as_json=as_json or bool(getattr(args, "as_json", False)))

    if args.cmd == "ui":
        from employeelock.ui import serve

        try:
            serve(host=args.host, port=args.port)
        except ValueError as exc:
            return _fail(str(exc), "employeelock ui")
        except OSError as exc:
            return _fail(
                f"Could not open the local page ({exc}).",
                "employeelock ui --port 8871",
            )
        return 0

    if args.cmd == "init":
        def _init():
            path = init_workbook(args.workbook, demo=not args.no_demo)
            if as_json:
                _print_json({"workbook": str(path), "demo": not args.no_demo})
            else:
                print(f"Wrote {path}")
                if args.no_demo:
                    print(
                        "Next: employeelock append "
                        f'{path} --event "what happened" --result "what followed"'
                    )
                else:
                    print("Includes two demo rows.")
                    print("Next: employeelock ui")
            return 0

        return _guard(_init)

    if args.cmd == "append":
        def _append():
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
            if as_json:
                _print_json(rec)
            else:
                print(f"Added {rec['entry_id']}")
                print(f"  Record: {rec['unowned']}")
                print(f"  Name: {rec['name_moved']}")
                print(f"  Row hash: {rec['row_hash']}")
                print(f"Next: employeelock verify {args.workbook}")
            return 0

        return _guard(_append)

    if args.cmd == "import":
        def _import():
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
            if as_json:
                _print_json(rec)
            else:
                names = ", ".join(item["original_name"] for item in rec.get("evidence") or [])
                print(f"Imported into {rec['entry_id']}")
                if names:
                    print(f"  Files: {names}")
                print(f"  Record: {rec['unowned']}")
                print(f"  Row hash: {rec['row_hash']}")
                print(f"Next: employeelock verify {args.workbook}")
            return 0

        return _guard(_import)

    if args.cmd == "verify":
        def _verify():
            report = verify_workbook(args.workbook)
            public = {
                "ok": report["ok"],
                "rows": report["rows"],
                "errors": report["errors"],
                "missing_files": report["missing_files"],
                "unowned": report["unowned"],
            }
            if as_json:
                _print_json(public)
            else:
                if report["ok"]:
                    print("Chain matches.")
                else:
                    print("Chain does not match.")
                print(f"  Rows: {report['rows']}")
                print(f"  Unowned: {report['unowned']}")
                missing = report["missing_files"]
                print(f"  Missing files: {len(missing)}")
                for item in missing:
                    print(f"    {item}")
                for err in report["errors"]:
                    print(f"  {err}")
                if report["ok"]:
                    print(f"Next: employeelock ui")
                else:
                    print(
                        "Next: restore the workbook from a copy you trust, "
                        f"or append a new row. Then run employeelock verify {args.workbook}"
                    )
            return 0 if report["ok"] else 1

        return _guard(_verify)

    return _fail(f'Unknown command "{args.cmd}".', "employeelock --help")


if __name__ == "__main__":
    raise SystemExit(main())

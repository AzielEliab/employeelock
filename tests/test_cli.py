"""CLI: init/append/import/verify, ui, doctor, version."""

from __future__ import annotations

import json
from pathlib import Path

from employeelock import __version__
from employeelock.cli import main


def test_cli_version(capsys) -> None:
    assert main(["version"]) == 0
    assert capsys.readouterr().out.strip() == f"employeelock {__version__}"
    assert __version__ == "0.1.0"


def test_help_lists_commands(capsys) -> None:
    try:
        main(["--help"])
    except SystemExit as exc:
        assert exc.code == 0
    out = capsys.readouterr().out
    for word in ("init", "append", "import", "verify", "ui", "doctor", "version"):
        assert word in out
    assert "Examples:" in out
    assert "THIS IS NOT" not in out


def test_bare_command_welcomes(capsys) -> None:
    assert main([]) == 0
    out = capsys.readouterr().out
    assert "employeelock ui" in out
    assert "Open http://127.0.0.1:8871/" in out
    assert "Aziel Eliab" in out
    assert "required" not in out.lower()


def _exit_code(argv: list[str]) -> int:
    try:
        return main(argv)
    except SystemExit as exc:
        code = exc.code
        return int(code) if isinstance(code, int) else 2


def test_unknown_command_has_next_step(capsys) -> None:
    assert _exit_code(["bogus"]) == 2
    err = capsys.readouterr().err
    assert 'Unknown command "bogus"' in err
    assert "employeelock --help" in err


def test_missing_append_args_have_next_step(capsys) -> None:
    assert _exit_code(["append"]) == 2
    err = capsys.readouterr().err
    assert "Next:" in err
    assert "--event" in err


def test_cli_init_append_verify(tmp_path: Path, capsys) -> None:
    wb = tmp_path / "book.xlsx"
    assert main(["init", str(wb), "--no-demo"]) == 0
    capsys.readouterr()
    code = main(
        [
            "append",
            str(wb),
            "--json",
            "--event",
            "desk closed",
            "--result",
            "logged",
            "--blame",
            "",
            "--owner",
            "records desk",
            "--short",
            "owned",
            "--long",
            "kept",
        ]
    )
    assert code == 0
    rec = json.loads(capsys.readouterr().out)
    assert rec["entry_id"] == "EL-0001"
    assert main(["verify", "--json", str(wb)]) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["ok"] is True
    assert report["rows"] == 1
    assert set(report) >= {"ok", "rows", "errors", "missing_files", "unowned"}


def test_cli_import(tmp_path: Path, capsys) -> None:
    wb = tmp_path / "book.xlsx"
    blob = tmp_path / "a.txt"
    blob.write_text("x", encoding="utf-8")
    main(["init", str(wb), "--no-demo"])
    capsys.readouterr()
    code = main(
        [
            "import",
            str(wb),
            str(blob),
            "--json",
            "--event",
            "file in",
            "--result",
            "hashed",
            "--owner",
            "records desk",
            "--short",
            "s",
            "--long",
            "l",
        ]
    )
    assert code == 0
    rec = json.loads(capsys.readouterr().out)
    assert rec["evidence"][0]["original_name"] == "a.txt"

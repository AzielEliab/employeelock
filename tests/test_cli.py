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


def test_cli_init_append_verify(tmp_path: Path, capsys) -> None:
    wb = tmp_path / "book.xlsx"
    assert main(["init", str(wb), "--no-demo"]) == 0
    capsys.readouterr()
    code = main(
        [
            "append",
            str(wb),
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
    assert main(["verify", str(wb)]) == 0
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

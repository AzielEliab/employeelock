from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = (ROOT / "SKILL.md").read_text(encoding="utf-8")


def test_skill_frontmatter_and_urls() -> None:
    assert SKILL.startswith("---\n")
    assert "name: EmployeeLock" in SKILL
    assert "append-preview" in SKILL
    assert "verify-canonical" in SKILL
    assert "Mozilla/5.0" in SKILL
    assert "https://employeelock-download-tracker.vibelock.workers.dev/openapi.json" in SKILL
    assert "https://aziel-runtime.vibelock.workers.dev/openapi.json" in SKILL
    assert "https://aziel-runtime.vibelock.workers.dev/mcp" in SKILL
    assert "not a court" in SKILL.lower()
    for word in ("event", "result", "blame", "owner", "short", "long"):
        assert word in SKILL
    assert "GodLock.AZ" not in SKILL
    assert "xlsx" in SKILL


def test_verify_and_doctor_still_present() -> None:
    cli = (ROOT / "employeelock" / "cli.py").read_text(encoding="utf-8")
    assert 'p_verify = sub.add_parser("verify"' in cli
    assert 'p_doc = sub.add_parser("doctor"' in cli
    doctor = ROOT / "employeelock" / "doctor.py"
    assert doctor.is_file()

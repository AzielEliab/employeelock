from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = (ROOT / "SKILL.md").read_text(encoding="utf-8")
README = (ROOT / "README.md").read_text(encoding="utf-8")
RUNTIME = (ROOT / "workers" / "download-tracker" / "src" / "runtime.js").read_text(
    encoding="utf-8"
)

FULL_AI_CLIENT_LIST = (
    "ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), "
    "Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, "
    "Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, "
    "Amazon Q tooling, DuckAssist, You.com, Cohere, and other "
    "MCP/OpenAPI-capable assistants."
)
EXCLUSIVE_TRIO = "Grok / ChatGPT / Venice"


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
    assert FULL_AI_CLIENT_LIST in SKILL
    assert EXCLUSIVE_TRIO not in SKILL


def test_readme_and_worker_use_full_ai_client_list() -> None:
    for text in (README, SKILL, RUNTIME):
        assert FULL_AI_CLIENT_LIST in text
        assert EXCLUSIVE_TRIO not in text
        assert "## For AI assistants (Grok" not in text
        assert "## Use with Grok" not in text
    assert "Aziel Eliab" in README
    assert "Aziel Eliab" in SKILL
    assert "GodLock.AZ" not in README
    assert "GodLock.AZ" not in RUNTIME


def test_verify_and_doctor_still_present() -> None:
    cli = (ROOT / "employeelock" / "cli.py").read_text(encoding="utf-8")
    assert 'p_verify = sub.add_parser("verify"' in cli
    assert 'p_doc = sub.add_parser("doctor"' in cli
    doctor = ROOT / "employeelock" / "doctor.py"
    assert doctor.is_file()

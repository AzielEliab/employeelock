"""Worker homepage rose-star brand mark.

Public mark is /sigil.png with empty alt and no words on the mark.
Scrub public “everblooming sigil” wording on the mark only.
Verify contracts that require Everblooming header/skill strings stay
unchanged (this repo’s skill/header contracts do not name the mark).
FragGate / Remain-OFF untouched.
Author: Aziel Eliab only.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "workers/download-tracker/src/index.js").read_text(encoding="utf-8")
MESH = (ROOT / "workers/download-tracker/src/mesh.js").read_text(encoding="utf-8")
WRANGLER = (ROOT / "workers/download-tracker/wrangler.toml").read_text(encoding="utf-8")
SKILL = (ROOT / "SKILL.md").read_text(encoding="utf-8")
RUNTIME = (ROOT / "workers/download-tracker/src/runtime.js").read_text(encoding="utf-8")
SIGIL = ROOT / "workers/download-tracker/public/sigil.png"

BRANDROW = (
    '<div class="brandrow"><img class="brandmark" src="/sigil.png" '
    'width="40" height="40" alt="" decoding="async"></div>'
)


def _homepage_html() -> str:
    start = INDEX.index("<!doctype html>")
    end = INDEX.index("</html>`", start) + len("</html>")
    return INDEX[start:end]


def test_homepage_brandrow_empty_alt_no_words() -> None:
    html = _homepage_html()
    assert BRANDROW in INDEX
    assert BRANDROW in html
    brand_idx = html.index(BRANDROW)
    h1_idx = html.index("<h1>EmployeeLock</h1>")
    assert brand_idx < h1_idx
    img = '<img class="brandmark" src="/sigil.png" width="40" height="40" alt="" decoding="async">'
    assert img in html
    assert 'alt="Everblooming' not in html
    assert 'alt="everblooming' not in html
    assert "Everblooming sigil" not in html
    assert "everblooming sigil" not in html.lower()
    assert ".brandrow" in html
    assert ".brandmark" in html
    assert 'href="/sigil.png"' in html
    assert "Aziel Eliab" in html
    assert "GodLock.AZ" not in html


def test_public_sigil_is_official_rose_star() -> None:
    assert SIGIL.is_file()
    data = SIGIL.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert 70_000 <= len(data) <= 80_000, len(data)
    assert len(data) == 75035


def test_assets_serve_sigil_not_worker_first() -> None:
    assert 'directory = "./public"' in WRANGLER
    assert "run_worker_first" in WRANGLER
    assert "/sigil.png" not in WRANGLER


def test_everblooming_header_skill_contracts_unchanged() -> None:
    """Do not rewrite skill/header verify strings to chase mark wording."""
    assert SKILL.startswith("---\n")
    assert "name: EmployeeLock" in SKILL
    assert "append-preview" in SKILL
    assert "verify-canonical" in SKILL
    assert "Mozilla/5.0" in SKILL
    assert "Aziel Eliab" in SKILL
    assert "const SKILL =" in RUNTIME
    assert "name: EmployeeLock" in RUNTIME
    assert "GET /v1/skill" in RUNTIME or "/v1/skill" in RUNTIME
    # Mark wording is not a skill/header contract.
    assert "Everblooming sigil" not in SKILL
    assert "Everblooming sigil" not in RUNTIME


def test_fraggate_and_remain_off_untouched() -> None:
    assert "MESH_DEFAULT_OFF = true" in MESH
    assert "enabled_default: false" in MESH
    assert "QNM-BUILD-1.0" in MESH
    assert "handleMeshApi" in INDEX
    assert "FG-HALLUC-TOOL" not in INDEX
    assert "fraggate_call" not in INDEX

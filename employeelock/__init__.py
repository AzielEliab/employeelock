"""EmployeeLock: hash-chained accountability workbook.

Local software plus a spreadsheet. Each LOG row carries event, result,
blame_placed, outcome_short, outcome_long, plus a separate owner_named.
Files are hashed and indexed, not embedded. SHA-256 chain in the
TemporalLock ethic. Spec string: employeelock-v0. Paper: EL-WP-0.1.

THIS IS: workbook (COVER, LOG, EVIDENCE, CHAIN, OWNERS, DASH, LISTS)
+ CLI (init/append/import/verify) + linear hash chain + countermeasure
against unowned/renamed rows.

THIS IS NOT: UL or a BAL issue paper; FoldLock; TemporalLock (borrows
ethic, different product); court filing / exhibit stickerer / counsel;
truth score / consensus / token; remote uploader / anonymous relay;
a charge sheet against a named living person.

Demo rows are generic format proof, not case facts.

Author: Aziel Eliab, 2026. Apache-2.0.
Forks are welcome and always allowed.
"""

from __future__ import annotations

from employeelock.engine import (
    ENGINE_VERSION,
    GENESIS_PREV,
    HASHED_FIELDS,
    LIMITATION,
    MAX_EVIDENCE,
    MAX_LOG,
    PAPER_ID,
    SPEC_STRING,
    append_row,
    canonical_json,
    guess_kind,
    init_workbook,
    import_files,
    row_hash,
    verify_workbook,
)

__version__ = "0.1.0"
__author__ = "Aziel Eliab"
__all__ = [
    "ENGINE_VERSION",
    "GENESIS_PREV",
    "HASHED_FIELDS",
    "LIMITATION",
    "MAX_EVIDENCE",
    "MAX_LOG",
    "PAPER_ID",
    "SPEC_STRING",
    "__version__",
    "append_row",
    "canonical_json",
    "guess_kind",
    "init_workbook",
    "import_files",
    "row_hash",
    "verify_workbook",
]

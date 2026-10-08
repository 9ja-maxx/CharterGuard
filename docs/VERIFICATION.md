# 🛡️ CharterGuard Verification & Test Evidence

## Automated Verification Suite

All core layers pass automated unit, linter, and integration checks:

| Verification Layer | Command Executed | Result Status |
|---|---|---|
| **Intelligent Contract Suite** | `python3 -m pytest tests -q` | `20 passed in 0.01s` |
| **GenVM Linter & SDK Checks** | `python3 -X utf8 -m genvm_linter.cli contracts/charter_guard.py` | `✓ Lint passed (3 checks, 0 errors)` |
| **Frontend State Machine Tests** | `npm test` (inside `frontend/`) | `3 passed in 0.14s` |
| **Production Web Client Build** | `npm run build` (inside `frontend/`) | `✓ Clean TypeScript/Vite bundle in 726ms` |

## Behavioral Coverage Matrix

- [x] **Permissionless Charter Registration**: Any DAO member can establish an independent charter without constructor roles or administrative allowlists.
- [x] **Schema & Bounds Enforcement**: Enforces minimum lengths for title (4), text (60), changelog (20), and validates 4-byte selectors, hex addresses, and positive values.
- [x] **Parent Hash & Epoch Lineage**: Every proposed amendment binds the active parent's SHA-256 text and manifest hash.
- [x] **Optimistic Concurrency Control**: Rejects stale amendment proposals and audits with `STALE_CHARTER_EPOCH`.
- [x] **Deterministic Calldata Divergence**: Machine diffing isolates target, selector, recipient, asset, value, and amount mutations without LLM involvement.
- [x] **Fully Disclosed Certification**: When amendments disclose executable and semantic shifts, consensus certifies the draft (`AUDIT_CERTIFIED`).
- [x] **Editorial Clarification Certification**: Harmless wording updates with zero calldata deltas certify under `EDITORIAL_ONLY`.
- [x] **Concealed Expansion Veto**: Disguised scope expansions ("Formatting only" with budget spikes) are vetoed on-chain (`AUDIT_VETOED`).
- [x] **Deterministic Override Defense**: A hallucinating model cannot certify an amendment if calldata diffs are present but undisclosed.
- [x] **Prompt Injection Neutralization**: Injected override commands in proposal calldata are fenced as inert data.
- [x] **Fail-Closed Consensus Resilience**: Corrupted or malformed validator outputs revert safely to `CONSENSUS_UNRESOLVED` and remain retryable.
- [x] **Author-Only Enactment Sentry**: Non-author attempts to enact certified amendments revert with `ONLY_CHARTER_AUTHOR`.
- [x] **Atomic Epoch Transition**: Enacting certified amendments atomically supersedes the parent epoch, sets the child as active canon, and increments the epoch pointer.
- [x] **Replay & Cross-Charter Isolation**: Prevent double-enactment and cross-mandate injection attacks.

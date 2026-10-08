# 🐉 DracoCharter Architecture

## Proof Obligation

**Core Invariant:** No governance charter or treasury mandate amendment can supersede an active baseline canon unless:
1. Every executable calldata parameter divergence (target, selector, recipient, asset, value, amount) is strictly flagged by deterministic code;
2. Multi-validator semantic consensus verifies that the proposer's natural-language changelog completely and truthfully discloses every material change; and
3. The original Charter Author signs the atomic enactment transition.

## Core State Machine

```text
[REGISTER CHARTER] 
       │
       ▼
[EPOCH 1: CANON_ACTIVE]
       │
       ├─────────────────────────────────┐
       ▼ (propose_amendment)             ▼ (propose_amendment)
[AMENDMENT DRAFT A]               [AMENDMENT DRAFT B]
       │                                 │
       ▼ (audit_amendment)               ▼ (audit_amendment)
[AUDIT_CERTIFIED]                 [AUDIT_VETOED]
       │                                 │
       ▼ (enact_amendment by Author)     ▼ (Cannot Enact)
[EPOCH 2: CANON_ACTIVE]           [TERMINAL VETO]
(Epoch 1 -> CANON_SUPERSEDED)
```

## Layered Authority Boundaries

| Architectural Layer | Authority & Responsibility | Enforcement Mechanism |
|---|---|---|
| **Cryptographic Canon Store** | Exact baseline and amendment text, calldata manifests, and epoch lineage | SHA-256 digests and sequential monotonic epoch counters |
| **Calldata Diff Engine** | Normalization and deterministic comparison of machine parameters | Strict Python dictionary & list diffing (`compute_manifest_divergence`) |
| **GenLayer Validator Council** | Bounded semantic evaluation of disclosure completeness & intent preservation | Multi-validator `gl.eq_principle.prompt_comparative` |
| **Charter Enactment Sentry** | State transition from certified draft to binding active canon | Strict creator-only access check (`get_caller_address() == charter["author"]`) |
| **Client Interface** | Non-custodial interaction, status visualization, and finality polling | Direct `genlayer-js: 2.0.0-rc.1` |

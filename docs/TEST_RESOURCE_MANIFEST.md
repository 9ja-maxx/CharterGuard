# 🐉 DracoCharter Test Resource Manifest

## Actors & Roles

- **Deployer**: Deploys `contracts/draco_charter.py` on GenLayer Studio Next. Possesses zero admin roles, constructor privileges, or special operational authority.
- **Charter Author (Wallet A)**: Establishes the baseline mandate (Epoch 1) and holds exclusive authority to enact certified amendments for this specific charter.
- **Auditor / Revision Proposer (Wallet B)**: Independent community participant who drafts prospective amendments, submits changelog disclosures, and triggers semantic validator audits.
- **Third-Party Reviewer (Wallet C)**: Unprivileged outsider attempting unauthorized enactment or replay attacks.

## Test Fixture Scenarios

### Fixture 1: Baseline Security Mandate (Epoch 1)
- **Domain**: `SECURITY_DIRECTIVE`
- **Title**: `Core Infrastructure Security Bounty Mandate`
- **Prose**: `Establish the Core Infrastructure Security Bounty mandate with an allocation of 5000 units. Funds are released exclusively to the verified security council upon delivery of an audited report.`
- **Action Manifest**: `target: 0xaaaa…aaaa, selector: 0x12345678, recipient: 0xbbbb…bbbb, asset: NATIVE, value: 0, amount: 5000`

### Fixture 2: Fully Disclosed Expansion (Happy Path)
- **Revised Prose**: Expands allocation from 5000 to 6500 units for emergency zero-knowledge rollup bridge formal verification.
- **Changelog**: Explicitly discloses the 1500 unit expansion and the specific verification scope.
- **Manifest**: `amount: 6500`
- **Expected Outcome**: `AUDIT_CERTIFIED` -> Author Enactment -> Epoch 2 `CANON_ACTIVE`.

### Fixture 3: Concealed Beneficiary & Scope Creep (Adversarial Path)
- **Revised Prose**: Diverts funds to an anonymous recipient (`0xcccc…cccc`) with discretionary spending authority.
- **Changelog**: Misleadingly claims "Minor syntax polishing, formatting fixes, and administrative cleanup."
- **Manifest**: `recipient: 0xcccc…cccc, amount: 8000`
- **Expected Outcome**: `AUDIT_VETOED` (`CONCEALED_EXPANSION`). Enactment blocked.

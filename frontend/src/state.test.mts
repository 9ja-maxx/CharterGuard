import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canAuditAmendment, canEnactAmendment, getStatusTone, isPendingReview } from './state.ts';

describe('CharterGuard state and lifecycle rules', () => {
  it('correctly maps actionable amendment states', () => {
    assert.equal(canAuditAmendment('AMENDMENT_PROPOSED'), true);
    assert.equal(canAuditAmendment('CONSENSUS_UNRESOLVED'), true);
    assert.equal(canAuditAmendment('AUDIT_CERTIFIED'), false);
    assert.equal(canAuditAmendment('CANON_ACTIVE'), false);
    assert.equal(canAuditAmendment('AUDIT_VETOED'), false);

    assert.equal(canEnactAmendment('AUDIT_CERTIFIED'), true);
    assert.equal(canEnactAmendment('AMENDMENT_PROPOSED'), false);
    assert.equal(canEnactAmendment('AUDIT_VETOED'), false);
    assert.equal(canEnactAmendment('CANON_ACTIVE'), false);
  });

  it('correctly assigns visual tones for protocol verdicts', () => {
    assert.equal(getStatusTone('CANON_ACTIVE'), 'emerald');
    assert.equal(getStatusTone('AUDIT_CERTIFIED'), 'emerald');
    assert.equal(getStatusTone('AUDIT_VETOED'), 'flame');
    assert.equal(getStatusTone('AMENDMENT_PROPOSED'), 'amber');
    assert.equal(getStatusTone('CANON_SUPERSEDED'), 'slate');
  });

  it('filters active review candidates from superseded history', () => {
    assert.equal(isPendingReview('AMENDMENT_PROPOSED'), true);
    assert.equal(isPendingReview('AUDIT_CERTIFIED'), true);
    assert.equal(isPendingReview('AUDIT_VETOED'), true);
    assert.equal(isPendingReview('CANON_ACTIVE'), false);
    assert.equal(isPendingReview('CANON_SUPERSEDED'), false);
  });
});

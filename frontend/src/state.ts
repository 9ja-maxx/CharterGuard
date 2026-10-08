export interface ActionItem {
  target: string;
  selector: string;
  value: number;
  asset: string;
  recipient: string;
  amount: number;
}

export interface AmendmentRecord {
  amendment_id: number;
  charter_id: number;
  epoch_number: number;
  parent_amendment_id: number;
  parent_text_hash: string;
  parent_manifest_hash: string;
  proposer: string;
  charter_text: string;
  text_hash: string;
  changelog_summary: string;
  actions: ActionItem[];
  manifest_hash: string;
  divergence_flags: string[];
  status: string;
  audit_ids: number[];
  created_at: number;
  enacted_at: number;
}

export interface CharterRecord {
  charter_id: number;
  author: string;
  title: string;
  domain: string;
  status: string;
  current_epoch: number;
  active_amendment_id: number;
  amendment_history: number[];
  created_at: number;
}

export interface AuditRecord {
  audit_id: number;
  charter_id: number;
  amendment_id: number;
  auditor_caller: string;
  final_status: string;
  decision: string;
  material_impacts: string[];
  disclosure_complete: boolean;
  scope_broadened: boolean;
  action_diff_present: boolean;
  action_diff_disclosed: boolean;
  reason: string;
  created_at: number;
}

export function canAuditAmendment(status: string): boolean {
  return status === 'AMENDMENT_PROPOSED' || status === 'CONSENSUS_UNRESOLVED';
}

export function canEnactAmendment(status: string): boolean {
  return status === 'AUDIT_CERTIFIED';
}

export function isPendingReview(status: string): boolean {
  return status === 'AMENDMENT_PROPOSED' || status === 'AUDIT_CERTIFIED' || status === 'AUDIT_VETOED' || status === 'CONSENSUS_UNRESOLVED';
}

export function getStatusTone(status: string): 'gold' | 'emerald' | 'flame' | 'amber' | 'slate' {
  switch (status) {
    case 'CANON_ACTIVE':
    case 'AUDIT_CERTIFIED':
      return 'emerald';
    case 'AUDIT_VETOED':
      return 'flame';
    case 'AMENDMENT_PROPOSED':
    case 'CONSENSUS_UNRESOLVED':
      return 'amber';
    case 'CANON_SUPERSEDED':
      return 'slate';
    default:
      return 'gold';
  }
}

export function formatTimestamp(unixSec: number): string {
  if (!unixSec) return '—';
  const d = new Date(unixSec * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

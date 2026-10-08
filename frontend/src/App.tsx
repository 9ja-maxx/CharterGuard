import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Flame,
  FileCheck2,
  FilePlus2,
  Scroll,
  Layers,
  ExternalLink,
  Wallet,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  GitCompare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  CONTRACT_ADDRESS,
  isConfigured,
  connectWallet,
  readContract,
  writeContract,
  formatAddress,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from './genlayer';
import {
  ActionItem,
  CharterRecord,
  AmendmentRecord,
  AuditRecord,
  canAuditAmendment,
  canEnactAmendment,
  getStatusTone,
  formatTimestamp,
} from './state';

type NavPage = 'canon' | 'register' | 'sentry' | 'audits';
interface Notice {
  type: 'busy' | 'ok' | 'err';
  message: string;
  txHash?: string;
}

const DEFAULT_ACTION: ActionItem = {
  target: '0x0000000000000000000000000000000000000000',
  selector: '0x12345678',
  value: 0,
  asset: 'NATIVE',
  recipient: '0x0000000000000000000000000000000000000000',
  amount: 1000,
};

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('canon');
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const [counts, setCounts] = useState({ charters: 0, amendments: 0, audits: 0 });
  const [charters, setCharters] = useState<CharterRecord[]>([]);
  const [amendments, setAmendments] = useState<Record<number, AmendmentRecord>>({});
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [selectedCharterId, setSelectedCharterId] = useState<number>(1);

  // Load contract state
  const refreshState = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const c = await readContract<{ charters: number; amendments: number; audits: number }>('get_charter_counts');
      const loadedCharters: CharterRecord[] = [];
      const loadedAmendments: Record<number, AmendmentRecord> = {};
      const loadedAudits: AuditRecord[] = [];

      for (let i = 1; i <= Number(c.charters); i++) {
        const item = await readContract<CharterRecord>('get_charter', [i]);
        if (item.charter_id) loadedCharters.push(item);
      }

      for (let i = 1; i <= Number(c.amendments); i++) {
        const item = await readContract<AmendmentRecord>('get_amendment', [i]);
        if (item.amendment_id) loadedAmendments[i] = item;
      }

      for (let i = 1; i <= Number(c.audits); i++) {
        const item = await readContract<AuditRecord>('get_audit', [i]);
        if (item.audit_id) loadedAudits.push(item);
      }

      setCounts({
        charters: Number(c.charters),
        amendments: Number(c.amendments),
        audits: Number(c.audits),
      });
      setCharters(loadedCharters);
      setAmendments(loadedAmendments);
      setAudits(loadedAudits);

      if (loadedCharters.length > 0 && !selectedCharterId) {
        setSelectedCharterId(loadedCharters[0].charter_id);
      }
    } catch (err: any) {
      console.error('State refresh failed:', err);
    }
  }, [selectedCharterId]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Execute on-chain action with status feedback
  async function executeCall(label: string, task: () => Promise<string>) {
    try {
      setNotice({ type: 'busy', message: `${label}: awaiting wallet signature & validator finalization…` });
      const txHash = await task();
      await refreshState();
      setNotice({
        type: 'ok',
        message: `${label} finalized on GenLayer Studio Next.`,
        txHash,
      });
    } catch (err: any) {
      setNotice({ type: 'err', message: err.message || String(err) });
      throw err;
    }
  }

  async function handleConnect() {
    try {
      const account = await connectWallet();
      setConnectedWallet(account);
    } catch (err: any) {
      setNotice({ type: 'err', message: err.message });
    }
  }

  const selectedCharter = charters.find((c) => c.charter_id === selectedCharterId);
  const activeEpoch = selectedCharter ? amendments[selectedCharter.active_amendment_id] : undefined;

  return (
    <div className="cg-layout">
      {/* Sidebar */}
      <aside className="cg-sidebar">
        <div className="cg-brand">
          <span className="cg-logo">🛡️</span>
          <div className="cg-title-wrap">
            <h2>CHARTERGUARD</h2>
            <span>Mandate Revision Sentry</span>
          </div>
        </div>

        <nav className="cg-nav">
          <button
            className={`cg-nav-btn ${activePage === 'canon' ? 'active' : ''}`}
            onClick={() => setActivePage('canon')}
          >
            <Scroll size={18} />
            Mandate Canon
          </button>
          <button
            className={`cg-nav-btn ${activePage === 'register' ? 'active' : ''}`}
            onClick={() => setActivePage('register')}
          >
            <FilePlus2 size={18} />
            Establish Mandate
          </button>
          <button
            className={`cg-nav-btn ${activePage === 'sentry' ? 'active' : ''}`}
            onClick={() => setActivePage('sentry')}
          >
            <GitCompare size={18} />
            Amendment Sentry
          </button>
          <button
            className={`cg-nav-btn ${activePage === 'audits' ? 'active' : ''}`}
            onClick={() => setActivePage('audits')}
          >
            <FileCheck2 size={18} />
            Validator Council Log
          </button>
        </nav>

        <div className="cg-sidebar-footer">
          <div className="cg-network-tag">
            <span style={{ color: '#10b981' }}>●</span> Studio Next (61997)
          </div>
          <a
            href={isConfigured ? getExplorerAddressUrl() : '#'}
            target="_blank"
            rel="noreferrer"
            className="cg-contract-link"
          >
            {isConfigured ? formatAddress(CONTRACT_ADDRESS) : 'Contract unconfigured'}
            <ExternalLink size={12} />
          </a>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="cg-main">
        <header className="cg-header">
          <div className="cg-header-title">
            <span>SOVEREIGN MANDATE DRIFT GUARD</span>
            <h1>
              {activePage === 'canon' && 'Governance Mandate Registry'}
              {activePage === 'register' && 'Seal Baseline Mandate (Epoch 1)'}
              {activePage === 'sentry' && 'Amendment Diff & Audit Workbench'}
              {activePage === 'audits' && 'Multi-Validator Consensus Records'}
            </h1>
          </div>

          <button className="cg-wallet-btn" onClick={handleConnect}>
            <Wallet size={16} />
            {connectedWallet ? formatAddress(connectedWallet) : 'Connect Wallet'}
          </button>
        </header>

        <div className="cg-view-container">
          {!isConfigured && (
            <div className="cg-banner err">
              <XCircle size={18} />
              <span>Contract address missing. Set VITE_CONTRACT_ADDRESS in frontend/.env</span>
            </div>
          )}

          {notice && (
            <div className={`cg-banner ${notice.type}`}>
              {notice.type === 'busy' && <Loader2 size={18} className="animate-spin" />}
              {notice.type === 'ok' && <CheckCircle2 size={18} />}
              {notice.type === 'err' && <ShieldAlert size={18} />}
              <span>{notice.message}</span>
              {notice.txHash && (
                <a href={getExplorerTxUrl(notice.txHash)} target="_blank" rel="noreferrer">
                  Explorer <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* View 1: Canon Registry */}
          {activePage === 'canon' && (
            <>
              <section className="cg-hero">
                <div className="cg-hero-content">
                  <div className="cg-hero-badge">
                    <Flame size={14} /> IMMUTABLE MANDATE EVOLUTION
                  </div>
                  <h2>Protect DAO Charters from Deceptive Scope Creep</h2>
                  <p>
                    CharterGuard enforces cryptographic parent-hash binding on governance revisions,
                    computes machine diffs over executable calldata parameters deterministically,
                    and mandates multi-validator semantic consensus to ensure change summaries
                    completely disclose material alterations before author enactment.
                  </p>
                </div>
                <div className="cg-hero-seal">
                  <ShieldCheck size={28} color="#f59e0b" />
                  <strong>Author-Only Enactment</strong>
                  <span>Validators cannot activate amendments</span>
                </div>
              </section>

              <div className="cg-metrics-grid">
                <div className="cg-metric-card">
                  <span className="cg-metric-val">{String(counts.charters).padStart(2, '0')}</span>
                  <span className="cg-metric-lbl">Active Charters</span>
                </div>
                <div className="cg-metric-card">
                  <span className="cg-metric-val">{String(counts.amendments).padStart(2, '0')}</span>
                  <span className="cg-metric-lbl">Sealed Epochs</span>
                </div>
                <div className="cg-metric-card">
                  <span className="cg-metric-val">{String(counts.audits).padStart(2, '0')}</span>
                  <span className="cg-metric-lbl">Validator Audits</span>
                </div>
              </div>

              <div>
                <div className="cg-grid-header">
                  <div>
                    <h3>Enacted Mandates</h3>
                    <p>Select any charter to audit pending amendments</p>
                  </div>
                  <button className="cg-wallet-btn" onClick={refreshState}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {charters.length > 0 ? (
                  <div className="cg-cards-container">
                    {charters.map((charter) => {
                      const active = amendments[charter.active_amendment_id];
                      return (
                        <div
                          key={charter.charter_id}
                          className="charter-guard-card"
                          onClick={() => {
                            setSelectedCharterId(charter.charter_id);
                            setActivePage('sentry');
                          }}
                        >
                          <div className="cg-card-top">
                            <span className="cg-domain-badge">{charter.domain}</span>
                            <span className={`cg-epoch-badge ${getStatusTone(active?.status || charter.status)}`}>
                              Epoch {charter.current_epoch}
                            </span>
                          </div>
                          <h4>{charter.title}</h4>
                          <p>{active?.charter_text || 'Loading canonical mandate prose…'}</p>
                          <div className="cg-card-foot">
                            <span>Author: {formatAddress(charter.author)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                              Audit Diff <ArrowRight size={14} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cg-empty">
                    No mandates established yet. Connect your wallet and seal the first baseline.
                  </div>
                )}
              </div>
            </>
          )}

          {/* View 2: Register Baseline Mandate */}
          {activePage === 'register' && (
            <RegisterView
              wallet={connectedWallet}
              onExecute={executeCall}
              onSuccess={() => setActivePage('canon')}
            />
          )}

          {/* View 3: Amendment Sentry */}
          {activePage === 'sentry' && (
            <SentryView
              wallet={connectedWallet}
              charters={charters}
              selectedCharter={selectedCharter}
              activeEpoch={activeEpoch}
              amendments={amendments}
              onSelectCharter={setSelectedCharterId}
              onExecute={executeCall}
            />
          )}

          {/* View 4: Validator Council Log */}
          {activePage === 'audits' && (
            <CouncilLogView audits={audits} amendments={amendments} />
          )}
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-View: Register Baseline Mandate
// -----------------------------------------------------------------------------
function RegisterView({
  wallet,
  onExecute,
  onSuccess,
}: {
  wallet: string;
  onExecute: (lbl: string, fn: () => Promise<string>) => Promise<void>;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('TREASURY_MANDATE');
  const [text, setText] = useState('');
  const [action, setAction] = useState<ActionItem>(DEFAULT_ACTION);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) throw new Error('Connect wallet first.');
    const manifestJson = JSON.stringify([
      {
        ...action,
        value: Number(action.value),
        amount: Number(action.amount),
      },
    ]);

    await onExecute('Seal Baseline Charter', () =>
      writeContract(wallet, 'register_charter', [title, domain, text, manifestJson])
    );
    onSuccess();
  }

  return (
    <form className="cg-form" onSubmit={handleSubmit}>
      <div className="cg-form-header">
        <h2>Establish Sovereign Charter Mandate</h2>
        <p>Your wallet becomes the sole enactment authority for certified amendments to this mandate.</p>
      </div>

      <div className="cg-field">
        <label>Mandate Title</label>
        <input
          className="cg-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Protocol Security & Treasury Allocation Mandate"
          minLength={4}
          required
        />
      </div>

      <div className="cg-field">
        <label>Governance Domain</label>
        <select className="cg-select" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="TREASURY_MANDATE">TREASURY_MANDATE</option>
          <option value="GRANT_COVENANT">GRANT_COVENANT</option>
          <option value="SECURITY_DIRECTIVE">SECURITY_DIRECTIVE</option>
          <option value="CORE_CONSTITUTION">CORE_CONSTITUTION</option>
          <option value="OPERATIONAL_CHARTER">OPERATIONAL_CHARTER</option>
        </select>
      </div>

      <div className="cg-field">
        <label>Canonical Mandate Prose (Epoch 1 Baseline)</label>
        <textarea
          className="cg-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the mandate's purpose, allocation caps, conditions, deliverables, and review deadlines…"
          minLength={60}
          required
        />
      </div>

      <ActionEditor action={action} onChange={setAction} />

      <button className="cg-btn-primary" type="submit">
        <ShieldCheck size={18} /> Seal Epoch 1 Baseline On-Chain
      </button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Sub-View: Amendment Sentry & Diff Workbench
// -----------------------------------------------------------------------------
function SentryView({
  wallet,
  charters,
  selectedCharter,
  activeEpoch,
  amendments,
  onSelectCharter,
  onExecute,
}: {
  wallet: string;
  charters: CharterRecord[];
  selectedCharter?: CharterRecord;
  activeEpoch?: AmendmentRecord;
  amendments: Record<number, AmendmentRecord>;
  onSelectCharter: (id: number) => void;
  onExecute: (lbl: string, fn: () => Promise<string>) => Promise<void>;
}) {
  const [revisedText, setRevisedText] = useState('');
  const [changelog, setChangelog] = useState('');
  const [action, setAction] = useState<ActionItem>(DEFAULT_ACTION);

  useEffect(() => {
    if (activeEpoch) {
      setRevisedText(activeEpoch.charter_text);
      setAction(activeEpoch.actions?.[0] || DEFAULT_ACTION);
      setChangelog('');
    }
  }, [activeEpoch?.amendment_id]);

  // Find candidate amendment awaiting audit or enactment
  const pendingCandidates = (
    selectedCharter?.amendment_history
      .map((id) => amendments[id])
      .filter((a) => a && a.status !== 'CANON_ACTIVE' && a.status !== 'CANON_SUPERSEDED') || []
  ).sort((a, b) => a.epoch_number - b.epoch_number);

  const candidate = pendingCandidates[pendingCandidates.length - 1];

  async function handlePropose() {
    if (!wallet || !selectedCharter || !activeEpoch) throw new Error('Connect wallet and select a charter.');
    const manifestJson = JSON.stringify([
      { ...action, value: Number(action.value), amount: Number(action.amount) },
    ]);

    await onExecute('Propose Amendment', () =>
      writeContract(wallet, 'propose_amendment', [
        selectedCharter.charter_id,
        selectedCharter.current_epoch,
        activeEpoch.text_hash,
        revisedText,
        changelog,
        manifestJson,
      ])
    );
  }

  async function handleAudit() {
    if (!wallet || !selectedCharter || !candidate) throw new Error('No pending amendment draft.');
    await onExecute('Execute Multi-Validator Semantic Audit', () =>
      writeContract(wallet, 'audit_amendment', [candidate.amendment_id, selectedCharter.current_epoch])
    );
  }

  async function handleEnact() {
    if (!wallet || !selectedCharter || !candidate) throw new Error('No certified amendment available.');
    await onExecute('Enact Certified Amendment', () =>
      writeContract(wallet, 'enact_amendment', [
        selectedCharter.charter_id,
        candidate.amendment_id,
        selectedCharter.current_epoch,
      ])
    );
  }

  return (
    <div>
      {/* Charter selector bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' }}>
        {charters.map((c) => (
          <button
            key={c.charter_id}
            className={`cg-nav-btn ${selectedCharter?.charter_id === c.charter_id ? 'active' : ''}`}
            onClick={() => onSelectCharter(c.charter_id)}
          >
            {c.title}
          </button>
        ))}
      </div>

      {!selectedCharter ? (
        <div className="cg-empty">Create or select a charter first.</div>
      ) : (
        <div className="cg-workbench">
          {/* Column 1: Active Baseline Canon */}
          <div className="cg-column-panel">
            <div className="cg-panel-header">
              <h3>ACTIVE CANON (Epoch {selectedCharter.current_epoch})</h3>
              <span className="cg-epoch-badge emerald">CANON_ACTIVE</span>
            </div>
            <div className="cg-field">
              <label>Immutable Prose</label>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                {activeEpoch?.charter_text}
              </p>
            </div>
            <div className="cg-field">
              <label>Text SHA-256 Digest</label>
              <code className="cg-hash-code">{activeEpoch?.text_hash}</code>
            </div>
            <div className="cg-field">
              <label>Calldata Manifest Parameters</label>
              <pre className="cg-hash-code">{JSON.stringify(activeEpoch?.actions, null, 2)}</pre>
            </div>
          </div>

          {/* Column 2: Proposed Amendment Draft */}
          <div className="cg-column-panel">
            <div className="cg-panel-header">
              <h3>PROPOSED AMENDMENT DRAFT</h3>
              <span className="cg-domain-badge">{selectedCharter.domain}</span>
            </div>
            <div className="cg-field">
              <label>Revised Mandate Prose</label>
              <textarea
                className="cg-textarea"
                value={revisedText}
                onChange={(e) => setRevisedText(e.target.value)}
                minLength={60}
                required
              />
            </div>
            <div className="cg-field">
              <label>Changelog & Semantic Disclosure</label>
              <textarea
                className="cg-textarea"
                style={{ minHeight: '80px' }}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Explicitly detail budget alterations, milestone scope, duration shifts, and recipient changes…"
                minLength={20}
                required
              />
            </div>
            <ActionEditor action={action} onChange={setAction} />
            <button className="cg-btn-primary" onClick={handlePropose}>
              Submit Cryptographically Bound Amendment
            </button>
          </div>

          {/* Column 3: Audit Council Sentry */}
          <div className="cg-column-panel">
            <div className="cg-panel-header">
              <h3>DRACO SENTRY GATE</h3>
              <Layers size={16} color="#f59e0b" />
            </div>

            {candidate ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>
                    Draft Epoch {candidate.epoch_number}
                  </span>
                  <span className={`cg-epoch-badge ${getStatusTone(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>

                <div className="cg-field">
                  <label>Deterministic Calldata Divergence</label>
                  <div className="cg-diff-badges">
                    {candidate.divergence_flags.length > 0 ? (
                      candidate.divergence_flags.map((flag) => (
                        <span key={flag} className="cg-diff-pill">
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#10b981' }}>CALLEDATA UNCHANGED</span>
                    )}
                  </div>
                </div>

                <div className="cg-field">
                  <label>Submitted Disclosure Changelog</label>
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    "{candidate.changelog_summary}"
                  </p>
                </div>

                <button
                  className="cg-btn-primary"
                  disabled={!canAuditAmendment(candidate.status)}
                  onClick={handleAudit}
                >
                  <ShieldAlert size={16} /> Summon Semantic Council
                </button>

                <button
                  className="cg-btn-primary"
                  style={{
                    background: canEnactAmendment(candidate.status)
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                      : undefined,
                  }}
                  disabled={!canEnactAmendment(candidate.status)}
                  onClick={handleEnact}
                >
                  <CheckCircle2 size={16} /> Enact Certified Canon (Author)
                </button>
              </>
            ) : (
              <div className="cg-empty" style={{ padding: '30px 10px' }}>
                No amendments currently awaiting audit or enactment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-View: Validator Council Audit Log
// -----------------------------------------------------------------------------
function CouncilLogView({
  audits,
  amendments,
}: {
  audits: AuditRecord[];
  amendments: Record<number, AmendmentRecord>;
}) {
  return (
    <div className="cg-audit-list">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <FileCheck2 size={20} color="#f59e0b" />
        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Append-Only Semantic Consensus Records</h2>
      </div>

      {audits.length > 0 ? (
        audits
          .slice()
          .reverse()
          .map((audit) => {
            const amended = amendments[audit.amendment_id];
            return (
              <div key={audit.audit_id} className="cg-audit-card">
                <div className="cg-audit-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#f59e0b' }}>
                      AUDIT #{String(audit.audit_id).padStart(2, '0')} (Epoch {amended?.epoch_number || audit.amendment_id})
                    </span>
                    <span className={`cg-epoch-badge ${getStatusTone(audit.final_status)}`}>
                      {audit.final_status}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {formatTimestamp(audit.created_at)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <span>
                    Decision: <strong>{audit.decision}</strong>
                  </span>
                  <span>
                    Complete Disclosure: <strong>{String(audit.disclosure_complete)}</strong>
                  </span>
                  <span>
                    Scope Broadened: <strong>{String(audit.scope_broadened)}</strong>
                  </span>
                  <span>
                    Action Diff Acknowledged: <strong>{String(audit.action_diff_disclosed)}</strong>
                  </span>
                </div>

                {audit.material_impacts.length > 0 && (
                  <div className="cg-diff-badges">
                    {audit.material_impacts.map((tag) => (
                      <span key={tag} className="cg-diff-pill" style={{ color: '#a855f7', borderColor: '#a855f7' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#64748b', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  Charter #{audit.charter_id} · Amendment #{audit.amendment_id} · Requested by {formatAddress(audit.auditor_caller)}
                </div>
              </div>
            );
          })
      ) : (
        <div className="cg-empty">No semantic consensus audits have landed on-chain yet.</div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Action Manifest Editor
// -----------------------------------------------------------------------------
function ActionEditor({
  action,
  onChange,
}: {
  action: ActionItem;
  onChange: (a: ActionItem) => void;
}) {
  return (
    <div className="cg-manifest-builder">
      <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' }}>
        Executable Calldata Payload (Deterministic Diff Engine)
      </span>
      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
        These fields are strictly diffed by Python smart contract code, never trusted to LLM inference.
      </p>

      <div className="cg-manifest-grid">
        <div className="cg-field">
          <label>Target Contract Address</label>
          <input
            className="cg-input"
            value={action.target}
            onChange={(e) => onChange({ ...action, target: e.target.value })}
            required
          />
        </div>
        <div className="cg-field">
          <label>Function Selector (4-byte hex)</label>
          <input
            className="cg-input"
            value={action.selector}
            onChange={(e) => onChange({ ...action, selector: e.target.value })}
            required
          />
        </div>
        <div className="cg-field">
          <label>Recipient Address</label>
          <input
            className="cg-input"
            value={action.recipient}
            onChange={(e) => onChange({ ...action, recipient: e.target.value })}
            required
          />
        </div>
        <div className="cg-field">
          <label>Asset Symbol or Token Address</label>
          <input
            className="cg-input"
            value={action.asset}
            onChange={(e) => onChange({ ...action, asset: e.target.value })}
            required
          />
        </div>
        <div className="cg-field">
          <label>Native Value (wei)</label>
          <input
            type="number"
            className="cg-input"
            value={action.value}
            onChange={(e) => onChange({ ...action, value: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
        <div className="cg-field">
          <label>Token Amount</label>
          <input
            type="number"
            className="cg-input"
            value={action.amount}
            onChange={(e) => onChange({ ...action, amount: Number(e.target.value) })}
            min={0}
            required
          />
        </div>
      </div>
    </div>
  );
}

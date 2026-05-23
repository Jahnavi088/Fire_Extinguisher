import { useState, useEffect, useReducer, useMemo } from 'react';
import './AuditLog.css';
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 25;

function reducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, items: action.items, total: action.total };
    case 'error': return { loading: false, error: action.error, items: [] };
    default: return state;
  }
}

const fmtDate = (d) => {
  const t = new Date(d);
  return `${t.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })} ${t.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
};

const AuditLog = ({ onBack }) => {
  const [state, dispatch] = useReducer(reducer, { loading: true, error: null, items: [], total: 0 });
  const { loading, error, items, total } = state;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ table_name: '', action: '', start_date: '', end_date: '' });
  const [search, setSearch] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedAudit, setSelectedAudit] = useState(null);

  useEffect(() => {
    let active = true;
    dispatch({ type: 'loading' });
    ApiService.getAdminAuditLog({ page, limit: PAGE_SIZE, ...filters })
      .then(res => { if (active) dispatch({ type: 'success', items: res.items || [], total: res.total || 0 }); })
      .catch(err => { if (active) dispatch({ type: 'error', error: err.message || 'Failed to load audit logs' }); });
    return () => { active = false; };
  }, [page, filters, retry]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(r =>
      (r.changed_by_user || '').toLowerCase().includes(q) ||
      (r.table_name || '').toLowerCase().includes(q) ||
      (r.action || '').toLowerCase().includes(q) ||
      (r.changed_by_id || '').toString().includes(q) ||
      JSON.stringify(r.new_values || {}).toLowerCase().includes(q) ||
      JSON.stringify(r.old_values || {}).toLowerCase().includes(q)
    );
  }, [items, search]);

  const clearFilters = () => {
    setFilters({ table_name: '', action: '', start_date: '', end_date: '' });
    setSearch('');
    setPage(1);
  };

  const moduleClass = (t) => {
    switch (t?.toLowerCase()) {
      case 'equipment': return 'al-mod-equipment';
      case 'users': return 'al-mod-users';
      case 'companies': return 'al-mod-companies';
      case 'checklists': return 'al-mod-checklists';
      default: return 'al-mod-default';
    }
  };

  const moduleIcon = (t) => {
    switch (t?.toLowerCase()) {
      case 'equipment':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'users':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'companies':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="16" />
            <line x1="15" y1="22" x2="15" y2="16" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm8-4h2v2h-2V6zm0 4h2v2h-2v-2z" />
          </svg>
        );
      case 'checklists':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
    }
  };

  const actionClass = (a) => {
    switch (a?.toUpperCase()) {
      case 'INSERT': return 'al-act-insert';
      case 'UPDATE': return 'al-act-update';
      case 'DELETE': return 'al-act-delete';
      default: return '';
    }
  };

  const actionLabel = (a) => {
    switch (a?.toUpperCase()) {
      case 'INSERT': return 'CREATE';
      case 'UPDATE': return 'MODIFY';
      case 'DELETE': return 'PURGE';
      default: return a;
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasActiveFilters = filters.table_name || filters.action || filters.start_date || filters.end_date || search;

  const IGNORED_DIFF_KEYS = new Set([
    'id', 'created_at', 'updated_at', 'sync_event_id', 'sync_device_id', 
    'sync_received_at', 'inspected_at', 'equipment_id'
  ]);

  const getChangedFields = (action, oldVals, newVals) => {
    let o = oldVals || {};
    let n = newVals || {};
    if (typeof o === 'string') try { o = JSON.parse(o); } catch {}
    if (typeof n === 'string') try { n = JSON.parse(n); } catch {}

    const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
    const changed = [];
    for (const k of keys) {
      if (IGNORED_DIFF_KEYS.has(k)) continue;
      if (action === 'UPDATE') {
        if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) {
          changed.push(k);
        }
      } else {
        changed.push(k);
      }
    }
    return changed.length > 0 ? changed.join(', ') : 'No tracked fields changed';
  };

  const renderDiff = (action, oldVals, newVals) => {
    let o = oldVals || {};
    let n = newVals || {};
    if (typeof o === 'string') try { o = JSON.parse(o); } catch {}
    if (typeof n === 'string') try { n = JSON.parse(n); } catch {}

    if (action === 'UPDATE') {
      const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
      const changes = [];
      for (const k of keys) {
        if (IGNORED_DIFF_KEYS.has(k)) continue;
        const strO = JSON.stringify(o[k]);
        const strN = JSON.stringify(n[k]);
        if (strO !== strN) {
          changes.push(
            <div key={k} className="al-diff-field-row">
              <span className="al-diff-key">{k}:</span>
              <span className="al-diff-val-removed">{o[k] === undefined ? 'null' : typeof o[k] === 'object' ? JSON.stringify(o[k]) : String(o[k])}</span>
              <span className="al-diff-arrow">→</span>
              <span className="al-diff-val-added">{n[k] === undefined ? 'null' : typeof n[k] === 'object' ? JSON.stringify(n[k]) : String(n[k])}</span>
            </div>
          );
        }
      }
      return changes.length > 0 ? <div className="al-diff-fields">{changes}</div> : <div className="al-diff-no-changes">No changes detected (or only system fields changed)</div>;
    } else {
      const vals = action === 'INSERT' ? n : o;
      const entries = Object.entries(vals).filter(([k]) => !IGNORED_DIFF_KEYS.has(k));
      return (
        <div className="al-diff-fields">
          {entries.map(([k, v]) => (
            <div key={k} className="al-diff-field-row">
              <span className="al-diff-key">{k}:</span>
              <span className={action === 'INSERT' ? 'al-diff-val-added' : 'al-diff-val-removed'}>
                {v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="ea-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>
          <div className="setup-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div className="setup-title">FDA Compliance Audit Logs</div>
            <div className="setup-subtitle">Part 11 Electronic Signature Immutable Ledger</div>
          </div>
        </div>
        <div className="pu-header-stats" style={{ margin: '0' }}>
          <div className="pu-stat-pill">
            <span className="pu-stat-dot" style={{ background: '#c084fc', boxShadow: '0 0 8px rgba(192,132,252,0.5)' }} />

          </div>
        </div>
      </div>

      <div className="ea-body">

        <div className="al-control-panel">
          <div className="al-search-input-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" className="al-search-input" placeholder="Search by agent, keys, values, actions..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="al-filter-select" value={filters.table_name}
            onChange={e => { setFilters(f => ({ ...f, table_name: e.target.value })); setPage(1); }}>
            <option value="">All Registries</option>
            <option value="equipment">Equipment</option>
            <option value="users">Users</option>
            <option value="companies">Companies</option>
            <option value="checklists">Checklists</option>
          </select>
          <select className="al-filter-select" value={filters.action}
            onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}>
            <option value="">All Sign-offs</option>
            <option value="INSERT">Create Records</option>
            <option value="UPDATE">Modify Records</option>
            <option value="DELETE">Purge Records</option>
          </select>
          <div className="al-date-group">
            <span className="al-date-label">From</span>
            <input type="date" className="al-date-input" value={filters.start_date}
              onChange={e => { setFilters(f => ({ ...f, start_date: e.target.value })); setPage(1); }} />
          </div>
          <div className="al-date-group">
            <span className="al-date-label">To</span>
            <input type="date" className="al-date-input" value={filters.end_date}
              onChange={e => { setFilters(f => ({ ...f, end_date: e.target.value })); setPage(1); }} />
          </div>
          {hasActiveFilters && (
            <button className="al-clear-btn" onClick={clearFilters}>Clear Filters</button>
          )}
        </div>

        <div className="al-table-wrap">
          {loading ? (
            <div className="al-state-block">
              <div className="al-spinner" />
              <span>Synchronizing ledger records...</span>
            </div>
          ) : error ? (
            <div className="al-state-block al-error-block">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {error}
              </span>
              <button className="al-retry-btn" onClick={() => setRetry(r => r + 1)}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="al-state-block">
              <div className="al-empty-icon" style={{ opacity: 0.35 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <p>No audit record seals match selected criteria.</p>
            </div>
          ) : (
            <table className="al-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Performed By</th>
                  <th>Changed Fields</th>
                  <th>View Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  let n = row.new_values || {};
                  let o = row.old_values || {};
                  if (typeof n === 'string') try { n = JSON.parse(n); } catch {}
                  if (typeof o === 'string') try { o = JSON.parse(o); } catch {}
                  const recId = row.record_id || n.id || o.id || 'N/A';
                  
                  return (
                    <tr key={row.id}>
                      <td className="al-td-timestamp" style={{ whiteSpace: 'nowrap' }}>{fmtDate(row.changed_at)}</td>
                      <td>
                        <span className={`al-module-badge ${moduleClass(row.table_name)}`}>
                          {moduleIcon(row.table_name)} {row.table_name.charAt(0).toUpperCase() + row.table_name.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`al-action-pill ${actionClass(row.action)}`}>{actionLabel(row.action)}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {row.table_name.charAt(0).toUpperCase() + row.table_name.slice(1).toLowerCase()} #{recId}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="al-td-operator">{row.changed_by_user || 'System'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {getChangedFields(row.action, row.old_values, row.new_values)}
                        </div>
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedAudit(row)}
                          style={{
                            padding: '4px 12px', background: '#e2e8f0', color: '#334155', 
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px'
                          }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && filtered.length > 0 && (
          <div className="al-pagination">
            <span className="al-page-count">
              Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> to <strong>{Math.min(page * PAGE_SIZE, total)}</strong> of <strong>{total}</strong> historical seals
            </span>
            <div className="al-page-btns">
              <button className="al-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Previous
              </button>
              <span className="al-page-indicator">Page {page} of {totalPages}</span>
              <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedAudit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px', 
            width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>Audit Record Details</h2>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {fmtDate(selectedAudit.changed_at)} • {selectedAudit.table_name.charAt(0).toUpperCase() + selectedAudit.table_name.slice(1).toLowerCase()} #{selectedAudit.record_id || 'N/A'} • {actionLabel(selectedAudit.action)}
                </div>
              </div>
              <button onClick={() => setSelectedAudit(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {renderDiff(selectedAudit.action, selectedAudit.old_values, selectedAudit.new_values)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLog;

import { useState, useEffect, useReducer, useMemo } from 'react';
import './AuditLog.css';
import { ApiService } from '../../services/apiService';

const PAGE_SIZE = 25;

function reducer(state, action) {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { loading: false, error: null, items: action.items, total: action.total };
    case 'error':   return { loading: false, error: action.error, items: [] };
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
      case 'equipment':  return 'al-mod-equipment';
      case 'users':      return 'al-mod-users';
      case 'companies':  return 'al-mod-companies';
      case 'checklists': return 'al-mod-checklists';
      default:           return 'al-mod-default';
    }
  };

  const moduleIcon = (t) => {
    switch (t?.toLowerCase()) {
      case 'equipment':  return '🔧';
      case 'users':      return '👤';
      case 'companies':  return '🏢';
      case 'checklists': return '📋';
      default:           return '📜';
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

  return (
    <div className="al-container">
      <div className="al-header">
        <div className="al-title-section">
          <button className="setup-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="al-title-icon">📜</div>
          <div className="al-title-texts">
            <h1 className="al-main-title">FDA Compliance Audit Logs</h1>
            <span className="al-subtitle">Part 11 Electronic Signature Immutable Ledger</span>
          </div>
        </div>
        <div className="pu-header-stats" style={{ margin: '0' }}>
          <div className="pu-stat-pill">
            <span className="pu-stat-dot" style={{ background: '#c084fc', boxShadow: '0 0 8px rgba(192,132,252,0.5)' }} />
            <span className="pu-stat-val">{total}</span>
            <span className="pu-stat-label">Total Seals</span>
          </div>
        </div>
      </div>

      <div className="al-control-panel">
        <div className="al-search-group">
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
            <option value="equipment">🔧 Equipment</option>
            <option value="users">👤 Users</option>
            <option value="companies">🏢 Companies</option>
            <option value="checklists">📋 Checklists</option>
          </select>
          <select className="al-filter-select" value={filters.action}
            onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}>
            <option value="">All Sign-offs</option>
            <option value="INSERT">Create Records</option>
            <option value="UPDATE">Modify Records</option>
            <option value="DELETE">Purge Records</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
      </div>

      <div className="al-table-wrap">
        {loading ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="um-spinner" />
            <span>Synchronizing ledger records...</span>
          </div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={() => setRetry(r => r + 1)}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="um-state-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="um-empty-icon">📜</span>
            <p>No audit record seals match selected criteria.</p>
          </div>
        ) : (
          <table className="al-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Signed Timestamp</th>
                <th style={{ width: '150px' }}>Registry Module</th>
                <th style={{ width: '110px' }}>Sign-off Action</th>
                <th style={{ width: '180px' }}>Authorized Operator</th>
                <th>Verifiable Changes Diff</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{fmtDate(row.changed_at)}</td>
                  <td>
                    <span className={`al-module-badge ${moduleClass(row.table_name)}`}>
                      {moduleIcon(row.table_name)} {row.table_name}
                    </span>
                  </td>
                  <td>
                    <span className={`al-action-pill ${actionClass(row.action)}`}>{actionLabel(row.action)}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{row.changed_by_user || 'System Node'}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', fontFamily: 'monospace' }}>
                      Operator ID: {row.changed_by_id || 'System'}
                    </div>
                  </td>
                  <td>
                    <div className="al-changes-inline">
                      {row.action === 'UPDATE' ? (
                        <>
                          <div className="al-diff-removed">- {JSON.stringify(row.old_values)}</div>
                          <div className="al-diff-added">+ {JSON.stringify(row.new_values)}</div>
                        </>
                      ) : (
                        <div className={row.action === 'INSERT' ? 'al-diff-added' : 'al-diff-removed'}>
                          {JSON.stringify(row.new_values || row.old_values)}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
              ◀ Previous
            </button>
            <span className="al-page-indicator">Page {page} of {totalPages}</span>
            <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;

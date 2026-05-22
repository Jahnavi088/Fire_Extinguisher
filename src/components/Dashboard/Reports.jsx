import { useState, useEffect, useMemo } from 'react';
import './Reports.css';
import { ApiService } from '../../services/apiService';

const fmt = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
const fmtTime = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/* ── SVG Icon Library ──────────────────────────────────────────────────────── */
const Icons = {
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  BellAlert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="11" y2="17" />
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-2-1-3.5-2-5 0 0-1 1.5-2 2-1-2-1-7-1-7z" />
      <path d="M10 17.5A2.5 2.5 0 0 0 12.5 20a2.5 2.5 0 0 0 1.5-.5" />
    </svg>
  ),
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  ShieldAlert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  ArrowUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  ArrowDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  RadioDot: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  FilePdf: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
};

const CATEGORY_ICONS = {
  'Identification':    '🔖',
  'Accessibility':     '🚪',
  'Physical Condition':'🔍',
  'Documentation':     '📄',
  'Compliance':        '✅',
  'Service':           '🔧',
  'Sign-off':          '✍️',
  'General':           '📋'
};

const REPORT_TYPES = [
  {
    id: 'inspections',
    name: 'Inspection History',
    Icon: Icons.Clipboard,
    desc: 'All safety checks and audit logs',
  },
  {
    id: 'status',
    name: 'Equipment Status',
    Icon: Icons.BarChart,
    desc: 'Live health & operational state',
  },
  {
    id: 'expiry',
    name: 'Expiry Schedule',
    Icon: Icons.Clock,
    desc: 'NOC, refill & training deadlines',
  },
  {
    id: 'alerts',
    name: 'Critical Alerts Log',
    Icon: Icons.BellAlert,
    desc: 'High-severity safety breach history',
  },
];

const ROWS_PER_PAGE = 10;

/* ── Sub-components ──────────────────────────────────────────────────────── */

const Spinner = () => (
  <div className="rpt-spinner">
    <div className="rpt-spinner-ring" />
    <span className="rpt-spinner-text">Loading report data…</span>
  </div>
);

const ScoreBar = ({ value }) => {
  const cls = value >= 80 ? 'high' : value >= 50 ? 'medium' : 'low';
  return (
    <div className="rpt-score-bar-wrap">
      <div className="rpt-score-bar-track">
        <div className={`rpt-score-bar-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`rpt-score-val ${cls}`}>{value}%</span>
    </div>
  );
};

const StatusChip = ({ status }) => {
  if (!status) return <span className="rpt-cell-muted">—</span>;
  const normalised = status.toLowerCase().replace(/[^a-z]/g, '');
  const cls =
    ['ok', 'pass', 'operational', 'active'].includes(normalised) ? 'ok' :
      ['fail', 'failed', 'critical'].includes(normalised) ? 'fail' :
        ['warning', 'maintenance'].includes(normalised) ? 'warning' : 'checked';
  return <span className={`rpt-status-chip ${cls}`}>{status.toUpperCase()}</span>;
};

const EmptyState = ({ tab }) => (
  <div className="rpt-empty">
    <div className="rpt-empty-icon"><Icons.Search /></div>
    <div className="rpt-empty-title">No records found</div>
    <div className="rpt-empty-desc">
      No {tab === 'inspections' ? 'inspection logs' : 'equipment records'} match your current
      filters. Try widening the date range or selecting a different category.
    </div>
  </div>
);

const ComingSoon = ({ tab }) => {
  const content = {
    expiry: {
      Icon: Icons.Clock,
      title: 'Expiry Schedule Report',
      desc: 'A comprehensive timeline of upcoming NOC renewals, refill deadlines, and personnel training expirations — compiled automatically from all active modules.',
      features: [
        { Icon: Icons.FileText, label: 'NOC Renewals' },
        { Icon: Icons.Flame, label: 'Refill Deadlines' },
        { Icon: Icons.GraduationCap, label: 'Training Expiry' },
        { Icon: Icons.Calendar, label: 'Calendar Export' },
      ],
    },
    alerts: {
      Icon: Icons.BellAlert,
      title: 'Critical Alerts Log',
      desc: 'A historical record of all high-severity safety events, near-misses, and compliance breaches across every facility and equipment category.',
      features: [
        { Icon: Icons.ShieldAlert, label: 'Severity Levels' },
        { Icon: Icons.MapPin, label: 'Location Drill-down' },
        { Icon: Icons.User, label: 'Responsible Party' },
        { Icon: Icons.Share, label: 'Incident Export' },
      ],
    },
  };
  const c = content[tab];
  return (
    <div className="rpt-coming-soon">
      <span className="rpt-coming-badge">Coming Soon</span>
      <div className="rpt-coming-icon"><c.Icon /></div>
      <div className="rpt-coming-title">{c.title}</div>
      <div className="rpt-coming-desc">{c.desc}</div>
      <div className="rpt-coming-features">
        {c.features.map(f => (
          <div key={f.label} className="rpt-coming-feature">
            <span className="rpt-coming-feature-icon"><f.Icon /></span>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Reports = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('inspections');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({ dateRange: '30', module: 'all' });
  const [page, setPage] = useState(1);

  // States for detailed inspection checklist viewing
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState([]);

  const handleUnitClick = async (row) => {
    if (!row || !row.id) return;
    setSelectedInspection(row);
    setModalLoading(true);
    setInspectionChecklist([]);
    try {
      // 1. Fetch detailed inspection responses
      const inspectionRes = await ApiService.getInspectionById(row.id);
      console.log('=== DEBUG: handleUnitClick ===', inspectionRes);
      const answersList = inspectionRes?.answers || inspectionRes?.items || inspectionRes?.responses || inspectionRes?.results || (Array.isArray(inspectionRes) ? inspectionRes : []);

      // 2. Fetch the checklist definition for this module to map full question texts
      const moduleId = row.module_id || 30; // default to fire extinguishers (30)
      const checklistRes = await ApiService.getModuleChecklists(moduleId);
      const checklistItems = Array.isArray(checklistRes) ? checklistRes : (checklistRes?.items || checklistRes?.data || checklistRes?.checklist_items || []);

      // 3. Map answers to standard questions
      const parseAnswer = (val) => {
        if (val === undefined || val === null) return 'N/A';
        const str = String(val).toLowerCase().trim();
        if (val === true || str === 'true' || str === 'yes' || str === 'pass' || str === 'ok' || str === '1' || str === 'y') return 'Yes';
        if (val === false || str === 'false' || str === 'no' || str === 'fail' || str === 'nok' || str === '0' || str === 'n') return 'No';
        if (str === 'na' || str === 'n/a') return 'N/A';
        return 'N/A';
      };

      let mapped = [];
      if (checklistItems.length > 0) {
        mapped = checklistItems.map(item => {
          const ans = answersList.find(a => {
            const aId = a.checklist_item_id !== undefined ? a.checklist_item_id :
                        a.checklist_id !== undefined ? a.checklist_id :
                        a.item_id !== undefined ? a.item_id :
                        a.question_id !== undefined ? a.question_id :
                        a.id !== undefined ? a.id : null;
            return aId !== null && String(aId) === String(item.id);
          });
          const rawAns = ans ? (ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response) : undefined;
          const remarksVal = ans ? (ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '') : '';
          return {
            id: item.id,
            question: item.question || item.description || 'Inspection Point',
            category: item.category || 'General',
            is_critical: !!(item.is_critical || item.critical),
            answer: parseAnswer(rawAns),
            remarks: remarksVal
          };
        });
      } else {
        // Fallback if no checklists definition found
        mapped = answersList.map((ans, idx) => {
          const rawAns = ans.answer !== undefined ? ans.answer : ans.value !== undefined ? ans.value : ans.status !== undefined ? ans.status : ans.result !== undefined ? ans.result : ans.response;
          const remarksVal = ans.remarks || ans.remark || ans.notes || ans.comment || ans.comments || '';
          const itemId = ans.checklist_item_id || ans.checklist_id || ans.item_id || ans.question_id || ans.id || idx;
          return {
            id: itemId,
            question: ans.question || ans.question_text || ans.description || `Check Item #${itemId || idx + 1}`,
            category: ans.category || 'General',
            is_critical: !!(ans.is_critical || ans.critical),
            answer: parseAnswer(rawAns),
            remarks: remarksVal
          };
        });
      }

      setInspectionChecklist(mapped);
    } catch (err) {
      console.error('Failed to fetch detailed checklist answers:', err);
      // Fallback
      setInspectionChecklist([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadChecklistPDF = (row, checklist) => {
    if (!row || !checklist) return;
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const dateStr = fmt(row.inspected_at || row.created_at) || '';
    const timeStr = fmtTime(row.inspected_at || row.created_at) || '';
    const scoreVal = parseFloat(row.score) || 0;
    
    // Group checklist items by category
    const categoriesMap = {};
    checklist.forEach(item => {
      const cat = item.category || 'General';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(item);
    });

    let checklistHtml = '';
    Object.entries(categoriesMap).forEach(([catName, items]) => {
      checklistHtml += `
        <div class="category-section">
          <h3>${esc(catName)}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 55%;">Question / Inspection Point</th>
                <th style="width: 15%; text-align: center;">Critical</th>
                <th style="width: 15%; text-align: center;">Answer</th>
                <th style="width: 15%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const ansClass = item.answer === 'Yes' ? 'ans-yes' : item.answer === 'No' ? 'ans-no' : 'ans-na';
                const critBadge = item.is_critical ? '<span class="crit-badge">CRITICAL</span>' : '<span class="non-crit">—</span>';
                return `
                  <tr>
                    <td class="question-cell">${esc(item.question)}</td>
                    <td style="text-align: center;">${critBadge}</td>
                    <td style="text-align: center;"><span class="ans-chip ${ansClass}">${esc(item.answer)}</span></td>
                    <td class="remarks-cell">${esc(item.remarks || '—')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>SOS Inspection Report - ${esc(row.sos_code || row.equipment_code)}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 32px; background: #fff; line-height: 1.4; }
  .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
  .header-logo { font-size: 20px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
  .header-title { font-size: 16px; font-weight: 700; color: #0f172a; text-align: right; }
  
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
  .info-item { display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px; }
  .info-lbl { font-weight: 600; color: #64748b; }
  .info-val { font-weight: 700; color: #0f172a; font-family: monospace; }
  
  .score-badge { display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; padding: 8px 16px; border-radius: 6px; }
  .score-high { background: #16a34a; }
  .score-medium { background: #d97706; }
  .score-low { background: #dc2626; }
  
  .category-section { margin-bottom: 20px; break-inside: avoid; }
  .category-section h3 { font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; border-left: 3px solid #0284c7; padding-left: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #0f172a; color: #fff; padding: 6px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tr:nth-child(even) td { background: #f8fafc; }
  
  .question-cell { font-weight: 500; color: #334155; }
  .crit-badge { background: rgba(220, 38, 38, 0.1); color: #dc2626; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 3px; border: 1px solid rgba(220, 38, 38, 0.2); }
  .non-crit { color: #cbd5e1; font-size: 9px; }
  
  .ans-chip { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .ans-yes { background: rgba(22, 163, 74, 0.1); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.25); }
  .ans-no { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.25); }
  .ans-na { background: rgba(148, 163, 184, 0.1); color: #475569; border: 1px solid rgba(148, 163, 184, 0.25); }
  
  .remarks-cell { font-style: italic; color: #64748b; font-size: 10px; }
  
  .footer-sig { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 16px; break-inside: avoid; }
  .sig-box { border: 1px dashed #cbd5e1; border-radius: 4px; height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; margin-top: 6px; font-size: 10px; }
  
  @media print {
    body { margin: 12px; font-size: 10px; }
    .info-grid { background: none; border: 1px solid #cbd5e1; }
    .crit-badge, .ans-chip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<table class="header-table">
  <tr>
    <td class="header-logo" style="border:none; padding:0;">SOS EMERGENCY SYSTEM</td>
    <td class="header-title" style="border:none; padding:0;">INSPECTION CHECKLIST REPORT</td>
  </tr>
</table>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
  <div style="flex:1;">
    <div class="info-grid">
      <div>
        <div class="info-item"><span class="info-lbl">Unit ID:</span><span class="info-val">${esc(row.sos_code || row.equipment_code)}</span></div>
        <div class="info-item"><span class="info-lbl">Module:</span><span class="info-val">${esc(row.module_name || 'Safety')}</span></div>
        <div class="info-item"><span class="info-lbl">Inspector:</span><span class="info-val">${esc(row.inspector_name || row.staff_name || row.user_name || '—')}</span></div>
      </div>
      <div>
        <div class="info-item"><span class="info-lbl">Date:</span><span class="info-val">${esc(dateStr)}</span></div>
        <div class="info-item"><span class="info-lbl">Time:</span><span class="info-val">${esc(timeStr)}</span></div>
        <div class="info-item"><span class="info-lbl">Result:</span><span class="info-val" style="color: ${row.result === 'PASS' || row.status === 'PASS' ? '#16a34a' : '#dc2626'}">${esc(row.result || row.status || 'CHECKED')}</span></div>
      </div>
    </div>
  </div>
  <div style="margin-left:24px; text-align:center;">
    <div class="score-badge ${scoreVal >= 80 ? 'score-high' : scoreVal >= 50 ? 'score-medium' : 'score-low'}">
      ${scoreVal}%
    </div>
    <div style="font-size:9px; font-weight:700; color:#64748b; margin-top:6px; text-transform:uppercase;">Overall Score</div>
  </div>
</div>

${checklistHtml}

<div class="category-section" style="margin-top: 16px;">
  <h3>Overall Remarks</h3>
  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px; font-style:italic; color:#475569; font-size:10px;">
    ${esc(row.remarks || row.overall_remarks || 'No overall remarks entered for this inspection.')}
  </div>
</div>

<div class="footer-sig">
  <div>
    <span style="font-weight:700; color:#475569;">Inspector Signature</span><br/>
    <span style="font-size:9px; color:#64748b;">Name: ${esc(row.inspector_name || row.staff_name || row.user_name || '—')}</span>
    <div class="sig-box">Certified via SOS App</div>
  </div>
  <div>
    <span style="font-weight:700; color:#475569;">Facility Supervisor Sign-off</span><br/>
    <span style="font-size:9px; color:#64748b;">Date: ________________________</span>
    <div class="sig-box">Signature &amp; Stamp</div>
  </div>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  };

  useEffect(() => {
    setPage(1);
    if (activeTab === 'expiry' || activeTab === 'alerts') {
      setData([]);
      return;
    }
    fetchReport();
  }, [activeTab, filter]);

  const fetchReport = async () => {
    if (activeTab === 'expiry' || activeTab === 'alerts') return;
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(filter.dateRange));
      const params = {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        module_id: filter.module === 'all' ? undefined : filter.module,
      };

      let res;
      if (activeTab === 'inspections') {
        res = await ApiService.getInspectionReports(params);
      } else if (activeTab === 'status') {
        res = await ApiService.getEquipmentStatusReports(params);
      } else {
        res = [];
      }

      let finalData = Array.isArray(res) ? res : (res?.items || res?.reports || res?.inspections || res?.data || []);
      
      // Do not show pending inspections in Service Reports
      if (activeTab === 'inspections') {
         const approvedLocally = JSON.parse(localStorage.getItem('approved_inspections') || '[]');
         finalData = finalData.filter(i => {
            if (approvedLocally.includes(i.id)) return true; // Explicitly approved, show it

            const stStatus = (i.status || '').toUpperCase();
            const stApprov = (i.approval_status || '').toUpperCase();
            const stRemarks = (i.remarks || i.overall_remarks || '').toUpperCase();
            
            const isPending = stApprov === 'PENDING' || stStatus === 'PENDING' || stRemarks.includes('[PENDING]');
            return !isPending;
         });
      }
      
      setData(finalData);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getExportRows = () => {
    if (activeTab === 'inspections') {
      const headers = ['S.No', 'Date', 'Time', 'Inspector', 'Unit ID', 'Module', 'Score (%)', 'Result', 'Remarks'];
      const rows = data.map((r, i) => [
        i + 1,
        fmt(r.inspected_at || r.created_at) || '',
        fmtTime(r.inspected_at || r.created_at) || '',
        r.inspector_name || r.staff_name || r.user_name || '',
        r.sos_code || r.equipment_code || '',
        r.module_name || 'Safety',
        parseFloat(r.score) || 0,
        r.result || r.status || 'CHECKED',
        r.remarks || r.overall_remarks || '',
      ]);
      return { headers, rows };
    }
    if (activeTab === 'status') {
      const headers = ['S.No', 'Unit ID', 'Equipment Type', 'Operational State', 'Readiness Score (%)', 'Building', 'Last Inspection'];
      const rows = data.map((r, i) => [
        i + 1,
        r.sos_code || '',
        r.module_name || r.equipment_type || '',
        r.operational_status_label || r.operational_status || 'Operational',
        parseFloat(r.readiness_score) || 0,
        r.building_name || '',
        fmt(r.last_inspection_date) || '',
      ]);
      return { headers, rows };
    }
    return null;
  };

  const handleExportCSV = () => {
    if (!data.length) { alert('No data to export.'); return; }
    const exported = getExportRows();
    if (!exported) return;
    const { headers, rows } = exported;
    const esc = (v) => {
      const s = String(v ?? '');
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!data.length) { alert('No data to export.'); return; }
    const exported = getExportRows();
    if (!exported) return;
    const { headers, rows } = exported;
    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const theadHtml = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;
    const tbodyHtml = rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    const reportLabel = REPORT_TYPES.find(t => t.id === activeTab)?.name || 'Report';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(reportLabel)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 24px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  .meta { color: #64748b; margin-bottom: 16px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print { body { margin: 12px; } }
</style></head><body>
<h1>Fire Safety — ${esc(reportLabel)}</h1>
<div class="meta">Generated on ${esc(dateStr)} &nbsp;|&nbsp; ${data.length} records</div>
<table><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pageData = useMemo(
    () => data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [data, page],
  );

  useMemo(() => {
    if (activeTab === 'inspections') {
      const total = data.length;
      const passed = data.filter(r => {
        const v = (r.result || r.status || '').toLowerCase().replace(/[^a-z]/g, '');
        return ['ok', 'pass', 'passed'].includes(v);
      }).length;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      return [
        { Icon: Icons.Clipboard, label: 'Total Records', value: total, color: 'blue', trend: null },
        { Icon: Icons.CheckCircle, label: 'Pass Rate', value: `${rate}%`, color: 'green', trend: 'up' },
        { Icon: Icons.XCircle, label: 'Issues Found', value: total - passed, color: 'red', trend: 'down' },
        { Icon: Icons.RefreshCw, label: 'Last Synced', value: 'Live', color: 'amber', trend: 'neutral' },
      ];
    }
    if (activeTab === 'status') {
      const total = data.length;
      const healthy = data.filter(r => parseFloat(r.readiness_score || 0) >= 80).length;
      const atRisk = data.filter(r => parseFloat(r.readiness_score || 0) < 60).length;
      const avg = total > 0 ? Math.round(data.reduce((s, r) => s + parseFloat(r.readiness_score || 0), 0) / total) : 0;
      return [
        { Icon: Icons.Box, label: 'Total Units', value: total, color: 'blue', trend: null },
        { Icon: Icons.Heart, label: 'Healthy (≥80%)', value: healthy, color: 'green', trend: 'up' },
        { Icon: Icons.AlertTriangle, label: 'At Risk (<60%)', value: atRisk, color: 'red', trend: 'down' },
        { Icon: Icons.TrendingUp, label: 'Avg. Readiness', value: `${avg}%`, color: 'amber', trend: avg >= 70 ? 'up' : 'down' },
      ];
    }
    return [
      { Icon: Icons.BarChart, label: 'Total Records', value: '—', color: 'blue', trend: null },
      { Icon: Icons.CheckCircle, label: 'Pass Rate', value: '—', color: 'green', trend: null },
      { Icon: Icons.BellAlert, label: 'Alerts', value: '—', color: 'red', trend: null },
      { Icon: Icons.Calendar, label: 'Period', value: `${filter.dateRange}d`, color: 'amber', trend: null },
    ];
  }, [data, activeTab, filter.dateRange]);

  const CATEGORIES = [
    { id: 'all', label: 'All Modules' },
    { id: '30',  label: 'Fire Extinguishers' },
    { id: '31',  label: 'Sprinklers' },
    { id: '39',  label: 'Emergency Exits' },
    { id: '38',  label: 'Emergency Lighting' },
    { id: '29',  label: 'Fire NOC' },
    { id: '23',  label: 'Trained Personnel' },
    { id: '34',  label: 'Fire Hydrants' },
    { id: '33',  label: 'Fire Hose Reels' },
    { id: '35',  label: 'Fire Alarms' },
    { id: '36',  label: 'Smoke Detectors' },
    { id: '59',  label: 'Muster Points' },
  ];

  const currentType = REPORT_TYPES.find(r => r.id === activeTab);
  const currentCat = CATEGORIES.find(c => c.id === filter.module) || CATEGORIES[0];
  const [catOpen, setCatOpen] = useState(false);
  const [tabOpen, setTabOpen] = useState(false);

  return (
    <div className="rpt-page">
      {/* ── Header ── */}
      <div className="rpt-header">
        <button
          className="rpt-back-btn"
          onClick={selectedInspection ? () => setSelectedInspection(null) : onBack}
          title={selectedInspection ? "Back to Inspection History" : "Back to Dashboard"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="rpt-header-info">
          <div className="rpt-title-text">
            {selectedInspection ? "Inspection Checklist Log" : "Reports"}
          </div>
        </div>

        <div className="rpt-header-actions">
          {selectedInspection ? (
            <button
              className="rpt-export-btn pdf"
              onClick={() => handleDownloadChecklistPDF(selectedInspection, inspectionChecklist)}
              disabled={modalLoading || inspectionChecklist.length === 0}
            >
              <Icons.FilePdf />
              Download Report
            </button>
          ) : (
            <>
              <button className="rpt-export-btn csv" onClick={handleExportCSV}>
                <Icons.Download />
                Export CSV
              </button>
              <button className="rpt-export-btn pdf" onClick={handleExportPDF}>
                <Icons.FilePdf />
                Export PDF
              </button>
            </>
          )}
        </div>
      </div>


      {/* Removed rpt-tabs-row as requested */}

      {/* ── Data Panel ── */}
      <div className="rpt-data-panel">
        {selectedInspection ? (
          <div className="rpt-detail-view">
            {/* Detail View Header / Meta Panel */}
            <div className="rpt-detail-header-panel">
              <div className="rpt-detail-meta-grid">
                <div className="rpt-detail-meta-item">
                  <span className="rpt-detail-meta-label">Unit ID</span>
                  <span className="rpt-detail-meta-val highlight">{selectedInspection.sos_code || selectedInspection.equipment_code}</span>
                </div>
                <div className="rpt-detail-meta-item">
                  <span className="rpt-detail-meta-label">Module / Equipment</span>
                  <span className="rpt-detail-meta-val">{selectedInspection.module_name || 'Safety'}</span>
                </div>
                <div className="rpt-detail-meta-item">
                  <span className="rpt-detail-meta-label">Inspector</span>
                  <span className="rpt-detail-meta-val">{selectedInspection.inspector_name || selectedInspection.staff_name || selectedInspection.user_name || '—'}</span>
                </div>
                <div className="rpt-detail-meta-item">
                  <span className="rpt-detail-meta-label">Date &amp; Time</span>
                  <span className="rpt-detail-meta-val">
                    {fmt(selectedInspection.inspected_at || selectedInspection.created_at)} &nbsp;
                    <span className="rpt-detail-meta-subval">{fmtTime(selectedInspection.inspected_at || selectedInspection.created_at)}</span>
                  </span>
                </div>
                <div className="rpt-detail-meta-item">
                  <span className="rpt-detail-meta-label">Status / Result</span>
                  <div className="rpt-detail-meta-val">
                    <StatusChip status={selectedInspection.result || selectedInspection.status || 'CHECKED'} />
                  </div>
                </div>
              </div>

              <div className="rpt-detail-meta-score">
                <div className="rpt-detail-score-circle">
                  <span className="rpt-detail-score-num">{parseFloat(selectedInspection.score) || 0}%</span>
                </div>
                <span className="rpt-detail-score-lbl">Readiness Score</span>
              </div>
            </div>

            {/* Checklist Answers Content */}
            <div className="rpt-detail-body">
              {modalLoading ? (
                <div className="rpt-detail-spinner">
                  <div className="rpt-detail-spinner-ring" />
                  <span>Fetching checklist answers…</span>
                </div>
              ) : inspectionChecklist.length === 0 ? (
                <div className="rpt-detail-empty">
                  <span>No detailed checklist responses found for this record.</span>
                </div>
              ) : (
                <div className="rpt-detail-checklist-content">
                  {/* Group items by Category in UI */}
                  {[...new Set(inspectionChecklist.map(i => i.category || 'General'))].map(categoryName => {
                    const catItems = inspectionChecklist.filter(i => (i.category || 'General') === categoryName);
                    const catIcon = CATEGORY_ICONS[categoryName] || '📋';
                    return (
                      <div key={categoryName} className="rpt-detail-cat-section">
                        <h4 className="rpt-detail-cat-header">
                          <span className="rpt-detail-cat-icon">{catIcon}</span>
                          {categoryName}
                        </h4>
                        <div className="rpt-detail-items-list">
                          {catItems.map((item, idx) => (
                            <div key={item.id || idx} className="rpt-detail-item-row">
                              <div className="rpt-detail-item-main">
                                <div className="rpt-detail-item-q">
                                  {item.question}
                                  {item.is_critical && (
                                    <span className="rpt-detail-item-crit-badge" title="Critical Safety Standard">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                {item.remarks && (
                                  <div className="rpt-detail-item-remarks">
                                    <strong>Remarks:</strong> {item.remarks}
                                  </div>
                                )}
                              </div>
                              <div className="rpt-detail-item-ans">
                                <span className={`rpt-detail-ans-tag ${
                                  item.answer === 'Yes' ? 'yes' : item.answer === 'No' ? 'no' : 'na'
                                }`}>
                                  {item.answer}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Overall Remarks Panel */}
                  <div className="rpt-detail-overall-remarks">
                    <h4 className="rpt-detail-remarks-title">Overall Remarks</h4>
                    <p className="rpt-detail-remarks-text">
                      {selectedInspection.remarks || selectedInspection.overall_remarks || 'No overall remarks entered.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="rpt-data-panel-header">
              <div className="rpt-data-panel-title">
                <div className="rpt-title-main">
                  {!loading && data.length > 0 && (
                    <span className="rpt-count-badge">{data.length} records found</span>
                  )}
                </div>
              </div>

              <div className="rpt-header-filters">
                {/* ── Report Type dropdown ── */}
                <div className="rpt-h-filter">
                  <div className="rpt-type-select-wrap">
                    <div
                      className={`rpt-type-select-trigger ${tabOpen ? 'open' : ''}`}
                      onClick={() => { setTabOpen(v => !v); setCatOpen(false); }}
                    >
                      <span>{currentType?.name || 'Inspection History'}</span>
                      <svg className={`rpt-chevron ${tabOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    {tabOpen && (
                      <>
                        <div className="rpt-dropdown-overlay" onClick={() => setTabOpen(false)} />
                        <div className="rpt-type-options">
                          {REPORT_TYPES.map(t => (
                            <div
                              key={t.id}
                              className={`rpt-type-option ${activeTab === t.id ? 'active' : ''}`}
                              onClick={() => { setActiveTab(t.id); setTabOpen(false); }}
                            >
                              {t.name}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Date range ── */}
                <div className="rpt-h-filter">
                  <select
                    className="rpt-h-select"
                    value={filter.dateRange}
                    onChange={e => setFilter({ ...filter, dateRange: e.target.value })}
                  >
                    <option value="7">Last 7d</option>
                    <option value="30">Last 30d</option>
                    <option value="90">Last 90d</option>
                    <option value="365">This Year</option>
                  </select>
                </div>


                <div className="rpt-h-filter">
                  <div className="rpt-custom-select-wrap">
                    <div className="rpt-custom-select-trigger" onClick={() => setCatOpen(!catOpen)}>
                      <span>{currentCat.label}</span>
                      <svg className={`rpt-chevron ${catOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                    
                    {catOpen && (
                      <>
                        <div className="rpt-dropdown-overlay" onClick={() => setCatOpen(false)} />
                        <div className="rpt-custom-options">
                          {CATEGORIES.map(cat => (
                            <div 
                              key={cat.id} 
                              className={`rpt-custom-option ${filter.module === cat.id ? 'active' : ''}`}
                              onClick={() => {
                                setFilter({ ...filter, module: cat.id });
                                setCatOpen(false);
                              }}
                            >
                              {cat.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(activeTab === 'expiry' || activeTab === 'alerts') ? (
              <ComingSoon tab={activeTab} />
            ) : loading ? (
              <Spinner />
            ) : (
              <div className="rpt-table-container">
                <table className="rpt-grid-table">
                  <thead>
                    {activeTab === 'inspections' && (
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                        <th>Date &amp; Time</th>
                        <th>Inspector</th>
                        <th>Unit ID</th>
                        <th>Module</th>
                        <th>Score</th>
                        <th style={{ textAlign: 'center' }}>Result</th>
                        <th>Remarks</th>
                      </tr>
                    )}
                    {activeTab === 'status' && (
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                        <th>Unit ID</th>
                        <th>Equipment Type</th>
                        <th style={{ textAlign: 'center' }}>Operational State</th>
                        <th>Readiness</th>
                        <th>Building</th>
                        <th>Last Inspection</th>
                      </tr>
                    )}
                    {activeTab === 'expiry' && (
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                        <th>Unit ID</th>
                        <th>Equipment / Module</th>
                        <th>Location / Building</th>
                        <th>Expiry Date</th>
                        <th style={{ textAlign: 'center' }}>Days Remaining</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    )}
                    {activeTab === 'alerts' && (
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                        <th>Date &amp; Time</th>
                        <th>Alert Level</th>
                        <th>Equipment / Module</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th>Assigned To</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {pageData.length > 0 ? pageData.map((row, i) => {
                      const sno = (page - 1) * ROWS_PER_PAGE + i + 1;

                      if (activeTab === 'inspections') return (
                        <tr key={i}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                          <td className="rpt-cell-date-new">
                            <div className="rpt-d">{fmt(row.inspected_at || row.created_at)}</div>
                            <div className="rpt-t">{fmtTime(row.inspected_at || row.created_at)}</div>
                          </td>
                          <td><span className="rpt-cell-text-dark">{row.inspector_name || row.staff_name || row.user_name || '—'}</span></td>
                          <td>
                            <button
                              className="rpt-unit-link"
                              onClick={() => handleUnitClick(row)}
                              title="Click to view answered checklist"
                            >
                              {row.sos_code || row.equipment_code || '—'}
                            </button>
                          </td>
                          <td><span className="rpt-cell-text-dark">{row.module_name || 'Safety'}</span></td>
                          <td><ScoreBar value={parseFloat(row.score) || 0} /></td>
                          <td style={{ textAlign: 'center' }}><StatusChip status={row.result || row.status || 'CHECKED'} /></td>
                          <td><span className="rpt-cell-muted-dark">{row.remarks || row.overall_remarks || '—'}</span></td>
                        </tr>
                      );

                      if (activeTab === 'status') return (
                        <tr key={i}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                          <td><span className="rpt-cell-mono-dark">{row.sos_code || '—'}</span></td>
                          <td><span className="rpt-cell-text-dark">{row.module_name || row.equipment_type || '—'}</span></td>
                          <td style={{ textAlign: 'center' }}><StatusChip status={row.operational_status_label || row.operational_status || 'Operational'} /></td>
                          <td><ScoreBar value={parseFloat(row.readiness_score) || 0} /></td>
                          <td><span className="rpt-cell-text-dark">{row.building_name || '—'}</span></td>
                          <td className="rpt-cell-date-new">
                            <div className="rpt-d">{fmt(row.last_inspection_date)}</div>
                            <div className="rpt-t">{fmtTime(row.last_inspection_date)}</div>
                          </td>
                        </tr>
                      );

                      if (activeTab === 'expiry') {
                        const expiryDate = row.expiry_date || row.next_service_date || row.due_date || null;
                        const daysLeft = expiryDate
                          ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                          : null;
                        const expCls = daysLeft === null ? 'checked' : daysLeft < 0 ? 'fail' : daysLeft <= 30 ? 'warning' : 'ok';
                        const expLabel = daysLeft === null ? '—' : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`;
                        return (
                          <tr key={i}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                            <td><span className="rpt-cell-mono-dark">{row.sos_code || row.unit_id || '—'}</span></td>
                            <td><span className="rpt-cell-text-dark">{row.equipment_type || row.module_name || row.name || '—'}</span></td>
                            <td><span className="rpt-cell-text-dark">{row.building_name || row.location || '—'}</span></td>
                            <td className="rpt-cell-date-new">
                              {expiryDate ? <><div className="rpt-d">{fmt(expiryDate)}</div></> : <span className="rpt-cell-muted-dark">—</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`rpt-status-chip ${expCls}`}>{expLabel}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <StatusChip status={row.status || (daysLeft !== null && daysLeft < 0 ? 'EXPIRED' : daysLeft !== null && daysLeft <= 30 ? 'DUE SOON' : 'OK')} />
                            </td>
                          </tr>
                        );
                      }

                      if (activeTab === 'alerts') {
                        const lvl = (row.level || row.severity || row.priority || 'info').toLowerCase();
                        const lvlCls = lvl === 'critical' || lvl === 'high' ? 'fail' : lvl === 'warning' || lvl === 'medium' ? 'warning' : 'checked';
                        return (
                          <tr key={i}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>{sno}</td>
                            <td className="rpt-cell-date-new">
                              <div className="rpt-d">{fmt(row.created_at || row.triggered_at)}</div>
                              <div className="rpt-t">{fmtTime(row.created_at || row.triggered_at)}</div>
                            </td>
                            <td><span className={`rpt-status-chip ${lvlCls}`}>{(row.level || row.severity || 'INFO').toUpperCase()}</span></td>
                            <td><span className="rpt-cell-text-dark">{row.equipment_name || row.module_name || row.source || '—'}</span></td>
                            <td><span className="rpt-cell-muted-dark">{row.message || row.description || '—'}</span></td>
                            <td style={{ textAlign: 'center' }}><StatusChip status={row.status || 'OPEN'} /></td>
                            <td><span className="rpt-cell-text-dark">{row.assigned_to || row.user_name || '—'}</span></td>
                          </tr>
                        );
                      }

                      return null;
                    }) : (
                      <tr>
                        <td colSpan={activeTab === 'inspections' ? 8 : 7}><EmptyState tab={activeTab} /></td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={activeTab === 'inspections' ? 8 : 7}>
                        <div className="rpt-pagination-new">
                          <span className="rpt-pg-info-new">
                            Showing <strong>{pageData.length}</strong> of <strong>{data.length}</strong> records
                          </span>
                          <div className="rpt-pg-controls-new">
                            <button className="rpt-pg-btn-new" onClick={() => setPage(page - 1)} disabled={page === 1}>← Previous</button>
                            <span className="rpt-pg-current-new">Page {page} of {totalPages}</span>
                            <button className="rpt-pg-btn-new" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next →</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
};


export default Reports;

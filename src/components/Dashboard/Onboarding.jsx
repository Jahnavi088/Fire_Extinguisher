import { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import './Onboarding.css';

const STEPS = [
  {
    id: 'company',
    icon: '🏢',
    title: 'Company Setup',
    desc: 'Register your company profile and site information.',
    action: 'Configure Company',
  },
  {
    id: 'users',
    icon: '👥',
    title: 'Add Users',
    desc: 'Create user accounts and assign roles for your team.',
    action: 'Manage Users',
  },
  {
    id: 'access',
    icon: '🔐',
    title: 'Equipment Access',
    desc: 'Grant users access to specific equipment modules.',
    action: 'Set Access',
  },
  {
    id: 'checklist',
    icon: '📋',
    title: 'Review Checklists',
    desc: 'Verify inspection checklists are ready for all modules.',
    action: 'View Checklists',
  },
];

const PAGE_TARGETS = {
  company: 'setup-company',
  users: 'users-manage',
  access: 'users-equipment-access',
  checklist: 'fe-checklist',
};

const Onboarding = ({ onBack, onNavigate }) => {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      ApiService.getAdminCompanies(),
      ApiService.getAdminUsers(),
    ]).then(([companiesRes, usersRes]) => {
      if (!active) return;

      const compList = companiesRes.status === 'fulfilled'
        ? (Array.isArray(companiesRes.value) ? companiesRes.value : (companiesRes.value?.companies || companiesRes.value?.data || []))
        : [];
      const userList = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.users || usersRes.value?.data || []))
        : [];

      setCompanies(compList);
      setUsers(userList);

      setCompletedSteps({
        company: compList.length > 0,
        users: userList.length > 1,
        access: userList.length > 1,
        checklist: true,
      });
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const doneCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPct = STEPS.length > 0 ? Math.round((doneCount / STEPS.length) * 100) : 0;

  return (
    <div className="ob-page">
      <div className="ob-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info">
          <div className="setup-header-icon">🚀</div>
          <div>
            <div className="setup-title">System Onboarding</div>
            <div className="setup-subtitle">Complete these steps to get your safety platform ready</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ob-loading">
          <div className="um-spinner" />
          <span>Checking setup status…</span>
        </div>
      ) : (
        <div className="ob-body">
          {/* Progress bar */}
          <div className="ob-progress-card">
            <div className="ob-progress-header">
              <span className="ob-progress-title">Setup Progress</span>
              <span className="ob-progress-pct">{progressPct}%</span>
            </div>
            <div className="ob-progress-track">
              <div className="ob-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="ob-progress-sub">
              {doneCount} of {STEPS.length} steps completed
            </div>
          </div>

          {/* Stats row */}
          <div className="ob-stats-row">
            <div className="ob-stat-card">
              <div className="ob-stat-icon">🏢</div>
              <div className="ob-stat-val">{companies.length}</div>
              <div className="ob-stat-label">Companies</div>
            </div>
            <div className="ob-stat-card">
              <div className="ob-stat-icon">👤</div>
              <div className="ob-stat-val">{users.length}</div>
              <div className="ob-stat-label">Users</div>
            </div>
            <div className="ob-stat-card">
              <div className="ob-stat-icon">✅</div>
              <div className="ob-stat-val">{doneCount}</div>
              <div className="ob-stat-label">Steps Done</div>
            </div>
            <div className="ob-stat-card">
              <div className="ob-stat-icon">⏳</div>
              <div className="ob-stat-val">{STEPS.length - doneCount}</div>
              <div className="ob-stat-label">Remaining</div>
            </div>
          </div>

          {/* Steps */}
          <div className="ob-steps-grid">
            {STEPS.map((step, idx) => {
              const done = !!completedSteps[step.id];
              return (
                <div key={step.id} className={`ob-step-card ${done ? 'done' : 'pending'}`}>
                  <div className="ob-step-num">{idx + 1}</div>
                  <div className="ob-step-icon">{step.icon}</div>
                  <div className="ob-step-body">
                    <div className="ob-step-title">{step.title}</div>
                    <div className="ob-step-desc">{step.desc}</div>
                  </div>
                  <div className="ob-step-right">
                    {done
                      ? <span className="ob-done-badge">✓ Done</span>
                      : <span className="ob-pending-badge">Pending</span>
                    }
                    {onNavigate && (
                      <button
                        className="ob-step-btn"
                        onClick={() => onNavigate(PAGE_TARGETS[step.id])}
                      >
                        {step.action} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {progressPct === 100 && (
            <div className="ob-complete-banner">
              🎉 All setup steps complete! Your safety platform is ready to use.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Onboarding;

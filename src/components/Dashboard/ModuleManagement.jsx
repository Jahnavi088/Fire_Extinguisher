import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import './SafetyDashboard.css'; // Reusing dashboard styles for consistency or create a specific CSS file if needed

const MODULE_IDS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const ModuleManagement = ({ onBack, allowedModules }) => {
  const [modules, setModules] = useState([]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesRes, weightsRes] = await Promise.all([
        ApiService.getAdminModules(),
        ApiService.getAdminModuleWeights(),
      ]);
      
      const mods = Array.isArray(modulesRes) ? modulesRes : (modulesRes?.data || []);
      const wgts = Array.isArray(weightsRes) ? weightsRes : (weightsRes?.data || []);
      
      // Filter modules to only those in the specified IDs, and if allowedModules is passed, restrict further
      let allowedIds = MODULE_IDS;
      if (allowedModules) {
        const allowedSet = new Set(allowedModules.map(m => m.id || m.module_id));
        allowedIds = MODULE_IDS.filter(id => allowedSet.has(id));
      }
      
      const filteredMods = mods.filter(m => allowedIds.includes(m.id || m.module_id));
      setModules(filteredMods);
      setWeights(wgts);
    } catch (err) {
      setError(err.message || 'Failed to load modules data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModule = async (id, field, value) => {
    setSaving(true);
    try {
      await ApiService.updateAdminModule(id, { [field]: value });
      setModules(prev => prev.map(m => (m.id || m.module_id) === id ? { ...m, [field]: value } : m));
    } catch (err) {
      alert('Failed to update module: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWeight = async (moduleId, newWeight) => {
    setSaving(true);
    try {
      await ApiService.updateAdminModuleWeight(moduleId, { weight: newWeight });
      setWeights(prev => prev.map(w => (w.module_id === moduleId) ? { ...w, weight: newWeight } : w));
    } catch (err) {
      alert('Failed to update module weight: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getWeightForModule = (moduleId) => {
    const w = weights.find(w => w.module_id === moduleId);
    return w ? w.weight : 0;
  };

  return (
    <div className="setup-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info">
          <div className="setup-header-icon">⚙️</div>
          <div>
            <div className="setup-title">Module Management</div>
            <div className="setup-subtitle">Manage system modules and their calculation weights</div>
          </div>
        </div>
      </div>

      <div className="um-content-wrap">
        {loading ? (
          <div className="um-state-block"><div className="um-spinner" /><span>Loading modules...</span></div>
        ) : error ? (
          <div className="um-state-block um-error-block">
            <span>⚠️ {error}</span>
            <button className="um-retry-btn" onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th-num">ID</th>
                <th>Module Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Weight (%)</th>
              </tr>
            </thead>
            <tbody>
              { (allowedModules ? MODULE_IDS.filter(id => (new Set(allowedModules.map(m => m.id || m.module_id))).has(id)) : MODULE_IDS).map(id => {
                const mod = modules.find(m => (m.id || m.module_id) === id) || { id, name: `Module ${id}`, code: `mod_${id}`, is_active: false };
                const weight = getWeightForModule(id);
                
                return (
                  <tr key={id}>
                    <td className="um-td-num">{id}</td>
                    <td><span className="um-name">{mod.name}</span></td>
                    <td className="um-mono">{mod.code}</td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={mod.is_active} 
                          onChange={(e) => handleUpdateModule(id, 'is_active', e.target.checked)}
                          disabled={saving}
                        />
                        <span className={`um-status ${!mod.is_active ? 'inactive' : 'active'}`}>
                          {mod.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={weight}
                        onChange={(e) => handleUpdateWeight(id, parseFloat(e.target.value) || 0)}
                        disabled={saving}
                        style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ModuleManagement;

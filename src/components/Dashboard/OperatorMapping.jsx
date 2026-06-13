import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import './OperatorMapping.css';

export default function OperatorMapping() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMapping, setNewMapping] = useState({
    branch: '',
    building: '',
    floor: '',
    zone: '',
    inspector: ''
  });

  const BRANCHES = ['North Branch', 'South Branch', 'East Branch', 'West Branch'];
  const BUILDINGS = ['Block A', 'Block B', 'Block C', 'Utility', 'Lab Wing'];
  const FLOORS = ['Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];
  const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];
  const INSPECTORS = ['Jahnavi', 'Rahul Sharma', 'Anjali Desai', 'Vikram Singh', 'Priya Patel'];

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      // Wait for the new API to be implemented, fallback to local storage for now
      let data = [];
      try {
        const res = await ApiService.getOperatorMappings();
        data = res.data || res?.items || res || [];
        if (Array.isArray(data) && data.length > 0) {
          data = data.map((item, i) => ({
             id: item.id || Date.now() + i,
             branch: item.branch_name || item.branch || '—',
             building: item.building_name || item.building || '—',
             floor: item.floor_name || item.floor || '—',
             zone: item.zone_name || item.zone || '—',
             inspector: item.user_name || item.inspector || `User ID: ${item.user_id}`
          }));
        }
      } catch {
        const local = localStorage.getItem('operator_mappings');
        data = local ? JSON.parse(local) : [
          { id: 1, branch: 'North Branch', building: 'Block A', floor: 'Floor 1', zone: 'Zone 2', inspector: 'Jahnavi' }
        ];
      }
      setMappings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newMapping.building || !newMapping.floor || !newMapping.zone || !newMapping.inspector) {
      alert("Please fill all fields");
      return;
    }

    try {
      // 1. Construct the payload matching the API requirements
      const payload = {
        user_id: 5,     // REQUIRED: Hardcoded for now. Map this to actual selected user ID later.
        module_id: 1,   // REQUIRED: Hardcoded for now. Map this to actual module ID later.
        building_name: newMapping.building,
        zone_name: newMapping.zone
      };

      try {
        // 2. Pass the formatted payload to your ApiService
        await ApiService.createOperatorMapping(payload);
      } catch {
        // Fallback local storage
        const current = [...mappings];
        current.push({ id: Date.now(), ...newMapping });
        localStorage.setItem('operator_mappings', JSON.stringify(current));
      }
      setNewMapping({ branch: '', building: '', floor: '', zone: '', inspector: '' });
      fetchMappings();
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="om-container">
      <div className="om-header">
        <div>
          <h2 className="om-title">Operator Mapping</h2>
          <div className="om-subtitle">Configure auto-assignment rules for inspection tasks</div>
        </div>
      </div>

      <div className="om-body">

        {/* Form to add a new mapping */}
        <div className="om-form-row">
          <div className="om-form-group">
            <label className="om-label">Branch</label>
            <select
              className="om-select"
              value={newMapping.branch}
              onChange={e => setNewMapping({ ...newMapping, branch: e.target.value })}
            >
              <option value="">Select Branch</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="om-form-group">
            <label className="om-label">Building</label>
            <select
              className="om-select"
              value={newMapping.building}
              onChange={e => setNewMapping({ ...newMapping, building: e.target.value })}
            >
              <option value="">Select Building</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              <option value="Building A">Building A</option>
            </select>
          </div>

          <div className="om-form-group">
            <label className="om-label">Floor</label>
            <select
              className="om-select"
              value={newMapping.floor}
              onChange={e => setNewMapping({ ...newMapping, floor: e.target.value })}
            >
              <option value="">Select Floor</option>
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="om-form-group">
            <label className="om-label">Zone</label>
            <select
              className="om-select"
              value={newMapping.zone}
              onChange={e => setNewMapping({ ...newMapping, zone: e.target.value })}
            >
              <option value="">Select Zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="om-form-group">
            <label className="om-label">Inspector</label>
            <select
              className="om-select"
              value={newMapping.inspector}
              onChange={e => setNewMapping({ ...newMapping, inspector: e.target.value })}
            >
              <option value="">Select Inspector</option>
              {INSPECTORS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <button className="om-action-btn primary" onClick={handleCreate}>Add Rule</button>
        </div>

        {/* Table of mappings */}
        <div className="om-table-wrap">
          <table className="om-table">
            <thead>
              <tr>
                <th className="om-th">Branch</th>
                <th className="om-th">Building</th>
                <th className="om-th">Floor</th>
                <th className="om-th">Zone</th>
                <th className="om-th">Inspector</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="om-td" style={{ textAlign: 'center', padding: '32px' }}>Loading mappings...</td>
                </tr>
              ) : mappings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="om-td" style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)' }}>No assignment rules configured.</td>
                </tr>
              ) : (
                mappings.map(m => (
                  <tr key={m.id} className="om-tr">
                    <td className="om-td">{m.branch}</td>
                    <td className="om-td">{m.building}</td>
                    <td className="om-td">{m.floor}</td>
                    <td className="om-td">{m.zone}</td>
                    <td className="om-td">{m.inspector}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

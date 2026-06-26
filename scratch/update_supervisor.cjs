const fs = require('fs');
const file = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/SupervisorOverview.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  // Reintroducing the static dummy data since they are unused in the fetcher
  const kpis = { assignedAreas: 4, myInspectors: 5, todaysInspections: 25, pendingInspections: 5, overdueInspections: 2, overallCompliance: 93 };
  const areasList = [
    { id: 1, name: 'Granulation Area', assets: 150, todaysTasks: 8, pending: 1, overdue: 0, compliance: 94 },
    { id: 2, name: 'Compression Area', assets: 120, todaysTasks: 6, pending: 1, overdue: 1, compliance: 92 },
    { id: 3, name: 'Coating Area', assets: 100, todaysTasks: 5, pending: 1, overdue: 0, compliance: 95 },
    { id: 4, name: 'Packing Area', assets: 80, todaysTasks: 6, pending: 2, overdue: 1, compliance: 90 }
  ];
  const teamList = [
    { id: 1, name: 'Ramesh', assigned: 5, completed: 4, pending: 1, compliance: 98 },
    { id: 2, name: 'Suresh', assigned: 5, completed: 3, pending: 2, compliance: 90 },
    { id: 3, name: 'Mahesh', assigned: 5, completed: 4, pending: 1, compliance: 94 },
    { id: 4, name: 'Karthik', assigned: 5, completed: 3, pending: 2, compliance: 90 },
    { id: 5, name: 'Prakash', assigned: 5, completed: 1, pending: 4, compliance: 70 }
  ];`;

const replacement = `  const areasList = useMemo(() => {
    if (!data) return [];
    const { eqList } = data;
    const map = {};
    eqList.forEach(eq => {
      const loc = eq.location_name || eq.zone_name || eq.department_name || eq.building_name || 'Unassigned Area';
      if (!map[loc]) {
        map[loc] = { id: loc, name: loc, assets: 0, todaysTasks: 0, pending: 0, overdue: 0, compliance: 100 };
      }
      map[loc].assets += 1;
      const st = (eq.status || '').toLowerCase();
      if (st === 'due-inspection' || st === 'due') map[loc].todaysTasks += 1;
      else if (st === 'warning' || st === 'pending') map[loc].pending += 1;
      else if (st === 'critical' || st === 'expired') map[loc].overdue += 1;
    });

    return Object.values(map).map(area => {
      const bad = area.pending + area.overdue;
      area.compliance = area.assets > 0 ? Math.round(((area.assets - bad) / area.assets) * 100) : 100;
      return area;
    });
  }, [data]);

  const kpis = useMemo(() => {
    if (!data) return { assignedAreas: 0, myInspectors: 0, todaysInspections: 0, pendingInspections: 0, overdueInspections: 0, overallCompliance: 100 };
    const { eqList, teamData } = data;
    
    let todaysInspections = 0, pendingInspections = 0, overdueInspections = 0;
    eqList.forEach(eq => {
      const st = (eq.status || '').toLowerCase();
      if (st === 'due-inspection' || st === 'due') todaysInspections += 1;
      else if (st === 'warning' || st === 'pending') pendingInspections += 1;
      else if (st === 'critical' || st === 'expired') overdueInspections += 1;
    });

    const badAssets = pendingInspections + overdueInspections;
    const overallCompliance = eqList.length > 0 ? Math.round(((eqList.length - badAssets) / eqList.length) * 100) : 100;

    return {
      assignedAreas: areasList.length,
      myInspectors: teamData.length,
      todaysInspections,
      pendingInspections,
      overdueInspections,
      overallCompliance
    };
  }, [data, areasList]);

  const teamList = useMemo(() => {
    if (!data) return [];
    const { teamData, reportsList } = data;
    
    return teamData.map(inspector => {
      const inspectorId = String(inspector.id);
      let completed = 0;
      
      reportsList.forEach(r => {
        if (String(r.user_id) === inspectorId || String(r.inspector_id) === inspectorId || r.user_name === inspector.username) {
           const st = (r.status || r.approval_status || '').toLowerCase();
           if (st === 'approved' || st === 'completed' || st === 'done') completed += 1;
        }
      });
      
      // Since we don't have explicit assigned tasks logic in API yet, we fallback to showing 0 pending
      // or matching against due eq.
      const assigned = completed; 
      const pending = 0;
      const compliance = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;
      
      return {
        id: inspector.id,
        name: inspector.name || inspector.username,
        assigned,
        completed,
        pending,
        compliance
      };
    });
  }, [data]);`;

if (content.includes("const kpis = { assignedAreas: 4")) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Supervisor dummy data replaced successfully!");
} else {
  console.log("Could not find the target string.");
}

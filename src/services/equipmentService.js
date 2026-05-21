import { ApiService } from './apiService';

/**
 * Shared equipment fetcher used by all module stats components.
 *
 * - type 'all'    → /reports/equipment-status  (full fleet, rich report data)
 * - type 'active' → /equipment active + upcoming combined
 * - other types   → /equipment filtered by status
 *
 * Always returns { items: [...], total: number }
 */
export const fetchEquipmentByStatus = async (moduleId, type) => {
  if (type === 'all') {
    const data = await ApiService.getEquipmentStatusReports({ module_id: moduleId, limit: 1000 });
    const items = data.items || [];
    const total = data.pagination?.total_matched ?? items.length;
    return { items, total };
  }

  if (type === 'active') {
    const [activeData, upcomingData] = await Promise.all([
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'active' }),
      ApiService.getEquipment({ module_id: moduleId, limit: 500, status: 'upcoming' }),
    ]);
    return {
      items: [...(activeData.items || []), ...(upcomingData.items || [])],
      total: (activeData.total || 0) + (upcomingData.total || 0),
    };
  }

  const data = await ApiService.getEquipment({ module_id: moduleId, limit: 500, status: type });
  return { items: data.items || [], total: data.total || 0 };
};

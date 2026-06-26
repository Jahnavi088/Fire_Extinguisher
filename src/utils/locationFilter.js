export const filterEquipmentByLocations = (equipmentList, userMappings, userRole) => {
  // Global roles see everything
  if (userRole === 'superadmin' || userRole === 'safety_manager') {
    return equipmentList;
  }

  // If no mappings, user has no access to any locations
  if (!userMappings || userMappings.length === 0) {
    return [];
  }

  return equipmentList.filter(eq => {
    // Check if the equipment falls into any of the user's assigned locations
    return userMappings.some(mapping => {
      const mBranchId = mapping.branch_id || mapping.branchId;
      const mBranchName = mapping.branch_name || mapping.branchName || mapping.branch;
      const mBuildingId = mapping.building_id || mapping.buildingId;
      const mBuildingName = mapping.building_name || mapping.buildingName || mapping.building;
      const mFloorId = mapping.floor_id || mapping.floorId;
      const mFloorName = mapping.floor_name || mapping.floorName || mapping.floor;
      const mZoneId = mapping.zone_id || mapping.zoneId;
      const mZoneName = mapping.zone_name || mapping.zoneName || mapping.zone;
      const mModuleId = mapping.module_id || mapping.moduleId;
      const mModuleCode = mapping.module_code || mapping.moduleCode;

      // location_id in the DB record is the branch — normalize before matching
      const eqBranchId = eq.branch_id || eq.branchId || eq.location_id;
      const eqBranchName = eq.branch_name || eq.branchName || eq.branch || eq.location_name;
      const eqBuildingId = eq.building_id || eq.buildingId;
      const eqBuildingName = eq.building_name || eq.buildingName || eq.building;
      const eqFloorId = eq.floor_id || eq.floorId;
      const eqFloorName = eq.floor_name || eq.floorName || eq.floor;
      const eqZoneId = eq.zone_id || eq.zoneId;
      const eqZoneName = eq.zone_name || eq.zoneName || eq.zone;
      const eqModuleId = eq.module_id || eq.moduleId;
      const eqModuleCode = eq.module_code || eq.moduleCode || eq.equipment_type;

      const match = (mId, mName, eqId, eqName) => {
        if (!mId && !mName) return true; // Mapping doesn't restrict this level
        if (mId && eqId && String(mId) === String(eqId)) return true; // ID match
        if (mName && eqName && String(mName).toLowerCase().trim() === String(eqName).toLowerCase().trim()) return true; // Name match
        return false;
      };

      const branchMatch = match(mBranchId, mBranchName, eqBranchId, eqBranchName);
      const buildingMatch = match(mBuildingId, mBuildingName, eqBuildingId, eqBuildingName);
      const floorMatch = match(mFloorId, mFloorName, eqFloorId, eqFloorName);
      const zoneMatch = match(mZoneId, mZoneName, eqZoneId, eqZoneName);
      const moduleMatch = (!mModuleId && !mModuleCode) || String(mModuleId) === '1' || String(eqModuleId) === String(mModuleId) || (eqModuleCode && mModuleCode && eqModuleCode === mModuleCode);

      return branchMatch && buildingMatch && floorMatch && zoneMatch && moduleMatch;
    });
  });
};

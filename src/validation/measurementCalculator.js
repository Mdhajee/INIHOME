/**
 * INIHOME 3D STUDIO
 * Building Measurement Calculator
 *
 * Member 2 - Measurement Module
 *
 * Base Unit: Metres
 */

function validateHouseData(houseData) {

  if (!houseData || typeof houseData !== "object") {
    throw new Error("Invalid house data.");
  }

  const { dimensions, rooms, doors = [], windows = [] } = houseData;

  if (
    !dimensions ||
    !Number.isFinite(dimensions.width) ||
    !Number.isFinite(dimensions.depth) ||
    !Number.isFinite(dimensions.height) ||
    dimensions.width <= 0 ||
    dimensions.depth <= 0 ||
    dimensions.height <= 0
  ) {
    throw new Error("Invalid building dimensions.");
  }

  if (!Array.isArray(rooms)) {
    throw new Error("Rooms must be an array.");
  }

  return { dimensions, rooms, doors, windows };
}


/**
 * Calculate individual room areas.
 */

export function calculateRoomAreas(houseData) {

  const { rooms } = validateHouseData(houseData);

  return rooms.map((room) => {

    if (
      !Number.isFinite(room.width) ||
      !Number.isFinite(room.depth) ||
      room.width <= 0 ||
      room.depth <= 0
    ) {
      throw new Error(`Invalid dimensions for room: ${room.id}`);
    }

    return {
      id: room.id,
      name: room.name,
      width: room.width,
      depth: room.depth,
      area: Number((room.width * room.depth).toFixed(2)),
    };

  });

}


/**
 * Calculate building floor area.
 */

export function calculateBuildingArea(houseData) {

  const { dimensions } = validateHouseData(houseData);

  return Number(
    (dimensions.width * dimensions.depth).toFixed(2)
  );

}


/**
 * Calculate total room area.
 */

export function calculateTotalRoomArea(houseData) {

  const roomAreas = calculateRoomAreas(houseData);

  return Number(
    roomAreas.reduce((total, room) => total + room.area, 0).toFixed(2)
  );

}


/**
 * Calculate unallocated floor area.
 */

export function calculateUnallocatedArea(houseData) {

  const buildingArea = calculateBuildingArea(houseData);

  const totalRoomArea = calculateTotalRoomArea(houseData);

  return Number(
    (buildingArea - totalRoomArea).toFixed(2)
  );

}


/**
 * Calculate building volume.
 */

export function calculateBuildingVolume(houseData) {

  const { dimensions } = validateHouseData(houseData);

  return Number(
    (
      dimensions.width *
      dimensions.depth *
      dimensions.height
    ).toFixed(2)
  );

}


/**
 * Calculate external wall surface area.
 */

export function calculateExternalWallArea(houseData) {

  const { dimensions } = validateHouseData(houseData);

  const perimeter = 2 * (
    dimensions.width + dimensions.depth
  );

  const grossWallArea = perimeter * dimensions.height;

  return Number(grossWallArea.toFixed(2));

}


/**
 * Calculate net external wall surface area.
 */

export function calculateNetExternalWallArea(houseData) {

  const { doors, windows } = validateHouseData(houseData);

  const grossWallArea = calculateExternalWallArea(houseData);

  const doorArea = doors.reduce((total, door) => {

    return total + door.width * door.height;

  }, 0);

  const windowArea = windows.reduce((total, window) => {

    return total + window.width * window.height;

  }, 0);

  return Number(
    (grossWallArea - doorArea - windowArea).toFixed(2)
  );

}


/**
 * Generate complete building measurement report.
 */

export function calculateBuildingMeasurements(houseData) {

  const roomAreas = calculateRoomAreas(houseData);

  const buildingArea = calculateBuildingArea(houseData);

  const totalRoomArea = calculateTotalRoomArea(houseData);

  return {

    building: {

      name: houseData.name,

      width: houseData.dimensions.width,

      depth: houseData.dimensions.depth,

      height: houseData.dimensions.height,

      floorArea: buildingArea,

      volume: calculateBuildingVolume(houseData),

    },

    rooms: roomAreas,

    summary: {

      totalRooms: roomAreas.length,

      totalRoomArea,

      unallocatedArea: calculateUnallocatedArea(houseData),

      roomCoveragePercentage: Number(
        ((totalRoomArea / buildingArea) * 100).toFixed(2)
      ),

      grossExternalWallArea: calculateExternalWallArea(houseData),

      netExternalWallArea: calculateNetExternalWallArea(houseData),

    },

    unit: "m",

  };

}
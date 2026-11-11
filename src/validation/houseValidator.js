/**
 * INIHOME 3D STUDIO
 * House Architectural Validation Engine
 *
 * Member 2 - Architectural Rules & Validation
 *
 * Validates:
 * 1. Building dimensions
 * 2. Room dimensions and boundaries
 * 3. Wall thickness
 * 4. Door dimensions and placement
 * 5. Window dimensions and placement
 */

import {
  ARCHITECTURAL_RULES,
  isPositiveNumber,
} from "./architecturalRules.js";


export function validateHouse(houseData) {

  const errors = [];
  const warnings = [];

  let totalChecks = 0;
  let passedChecks = 0;

  function check(condition, message, element = "Building") {

    totalChecks++;

    if (condition) {
      passedChecks++;
    } else {
      errors.push({
        element,
        message,
      });
    }

  }

  // 1. CHECK INPUT

  check(
    houseData !== null &&
    typeof houseData === "object" &&
    !Array.isArray(houseData),
    "Invalid building data."
  );

  if (
    !houseData ||
    typeof houseData !== "object" ||
    Array.isArray(houseData)
  ) {
    return {
      valid: false,
      errors,
      warnings,
      summary: {
        totalChecks,
        passed: passedChecks,
        failed: errors.length,
      },
    };
  }


  // 2. CHECK BUILDING DIMENSIONS

  const dimensions = houseData.dimensions;

  check(
    dimensions && typeof dimensions === "object",
    "Building dimensions are missing."
  );

  if (!dimensions || typeof dimensions !== "object") {
    return {
      valid: false,
      errors,
      warnings,
      summary: {
        totalChecks,
        passed: passedChecks,
        failed: errors.length,
      },
    };
  }

  const rules = ARCHITECTURAL_RULES;

  check(
    isPositiveNumber(dimensions.width) &&
    dimensions.width >= rules.building.minWidth,
    "Invalid building width."
  );

  check(
    isPositiveNumber(dimensions.depth) &&
    dimensions.depth >= rules.building.minDepth,
    "Invalid building depth."
  );

  check(
    isPositiveNumber(dimensions.height) &&
    dimensions.height >= rules.building.minHeight &&
    dimensions.height <= rules.building.maxHeight,
    "Building height is outside permitted limits."
  );

  check(
    isPositiveNumber(dimensions.wallThickness) &&
    dimensions.wallThickness >= rules.wall.minThickness &&
    dimensions.wallThickness <= rules.wall.maxThickness,
    "Invalid wall thickness."
  );


  // 3. CHECK ROOMS

  check(
    Array.isArray(houseData.rooms),
    "Rooms must be provided as an array."
  );

  if (Array.isArray(houseData.rooms)) {

    houseData.rooms.forEach((room, index) => {

      const element = room?.id || `Room ${index + 1}`;

      check(
        room && typeof room === "object",
        "Invalid room object.",
        element
      );

      if (!room || typeof room !== "object") return;

      check(
        typeof room.id === "string" && room.id.length > 0,
        "Room ID is missing.",
        element
      );

      check(
        isPositiveNumber(room.width) &&
        room.width >= rules.room.minWidth,
        "Room width is invalid.",
        element
      );

      check(
        isPositiveNumber(room.depth) &&
        room.depth >= rules.room.minDepth,
        "Room depth is invalid.",
        element
      );

      check(
        isPositiveNumber(room.x) ||
        room.x === 0,
        "Invalid room X coordinate.",
        element
      );

      check(
        isPositiveNumber(room.z) ||
        room.z === 0,
        "Invalid room Z coordinate.",
        element
      );

      if (
        isPositiveNumber(room.width) &&
        isPositiveNumber(room.depth)
      ) {

        check(
          room.width * room.depth >= rules.room.minArea,
          "Room area is below minimum requirement.",
          element
        );

      }

      // Check building boundaries

      if (
        isPositiveNumber(dimensions.width) &&
        isPositiveNumber(dimensions.depth) &&
        isPositiveNumber(room.width) &&
        isPositiveNumber(room.depth) &&
        Number.isFinite(room.x) &&
        Number.isFinite(room.z)
      ) {

        check(
          room.x >= 0 &&
          room.z >= 0 &&
          room.x + room.width <= dimensions.width &&
          room.z + room.depth <= dimensions.depth,
          "Room exceeds building boundaries.",
          element
        );

      }

    });

  }


  // 4. CHECK DOORS

  check(
    Array.isArray(houseData.doors),
    "Doors must be provided as an array."
  );

  if (Array.isArray(houseData.doors)) {

    if (houseData.doors.length > 1) {
      warnings.push(
        "Current House3D implementation renders only the first door."
      );
    }

    houseData.doors.forEach((door, index) => {

      const element = door?.id || `Door ${index + 1}`;

      check(
        door && typeof door === "object",
        "Invalid door object.",
        element
      );

      if (!door || typeof door !== "object") return;

      check(
        isPositiveNumber(door.width) &&
        door.width >= rules.door.minWidth &&
        door.width <= rules.door.maxWidth,
        "Door width is invalid.",
        element
      );

      check(
        isPositiveNumber(door.height) &&
        door.height >= rules.door.minHeight &&
        door.height < dimensions.height,
        "Door height must be below building height.",
        element
      );

      check(
        isPositiveNumber(door.x) || door.x === 0,
        "Invalid door X coordinate.",
        element
      );

      // Door X represents LEFT EDGE.
      if (
        Number.isFinite(door.x) &&
        isPositiveNumber(door.width) &&
        isPositiveNumber(dimensions.width)
      ) {

        check(
          door.x >= 0 &&
          door.x + door.width <= dimensions.width,
          "Door exceeds building width.",
          element
        );

      }

    });

  }


  // 5. CHECK WINDOWS

  check(
    Array.isArray(houseData.windows),
    "Windows must be provided as an array."
  );

  if (Array.isArray(houseData.windows)) {

    houseData.windows.forEach((window, index) => {

      const element = window?.id || `Window ${index + 1}`;

      check(
        window && typeof window === "object",
        "Invalid window object.",
        element
      );

      if (!window || typeof window !== "object") return;

      check(
        isPositiveNumber(window.width) &&
        window.width >= rules.window.minWidth,
        "Window width is invalid.",
        element
      );

      check(
        isPositiveNumber(window.height) &&
        window.height >= rules.window.minHeight,
        "Window height is invalid.",
        element
      );

      check(
        isPositiveNumber(window.x) || window.x === 0,
        "Invalid window X coordinate.",
        element
      );

      // Window X represents CENTRE.
      if (
        Number.isFinite(window.x) &&
        isPositiveNumber(window.width) &&
        isPositiveNumber(dimensions.width)
      ) {

        check(
          window.x - window.width / 2 >= 0 &&
          window.x + window.width / 2 <= dimensions.width,
          "Window exceeds building width.",
          element
        );

      }

      // Current renderer places window centre at Y = 1.9.
      const windowCenterY = 1.9;

      if (
        isPositiveNumber(window.height) &&
        isPositiveNumber(dimensions.height)
      ) {

        check(
          windowCenterY - window.height / 2 >= 0 &&
          windowCenterY + window.height / 2 <= dimensions.height,
          "Window exceeds building height.",
          element
        );

      }

    });

  }


  // 6. FINAL RESULT

  return {

    valid: errors.length === 0,

    errors,

    warnings,

    summary: {

      totalChecks,

      passed: passedChecks,

      failed: errors.length,

    },

  };

}
/**
 * INIHOME 3D STUDIO
 * Architectural Rules Configuration
 *
 * Member 2 - Architectural Rules & Validation
 *
 * Base measurement unit: metres (m)
 */

export const ARCHITECTURAL_RULES = {

  // Building constraints
  building: {
    minWidth: 1,
    minDepth: 1,
    minHeight: 2.1,
    maxHeight: 100,
  },

  // Room constraints
  room: {
    minWidth: 1,
    minDepth: 1,
    minArea: 2,
  },

  // Wall constraints
  wall: {
    minThickness: 0.05,
    maxThickness: 0.6,
  },

  // Door constraints
  door: {
    minWidth: 0.6,
    maxWidth: 3,
    minHeight: 1.5,
  },

  // Window constraints
  window: {
    minWidth: 0.3,
    minHeight: 0.3,
  },

  // General constraints
  general: {
    coordinateTolerance: 0.001,
    measurementUnit: "meters",
  },

};


/**
 * Get architectural rule configuration.
 */
export function getArchitecturalRules() {
  return ARCHITECTURAL_RULES;
}


/**
 * Validate whether a measurement is positive.
 */
export function isPositiveNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}
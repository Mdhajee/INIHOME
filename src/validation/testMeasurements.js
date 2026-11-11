import { houseData } from "../data/houseData.js";

import {
  calculateBuildingMeasurements,
  calculateRoomAreas,
  calculateBuildingArea,
  calculateBuildingVolume,
  calculateUnallocatedArea,
} from "./measurementCalculator.js";


console.log("\n========== MEASUREMENT TESTS ==========");


// TEST 1: BUILDING AREA

console.log("\nTEST 1: Building Area");

console.log(
  calculateBuildingArea(houseData),
  "m2"
);


// TEST 2: BUILDING VOLUME

console.log("\nTEST 2: Building Volume");

console.log(
  calculateBuildingVolume(houseData),
  "m3"
);


// TEST 3: ROOM AREAS

console.log("\nTEST 3: Individual Room Areas");

console.table(
  calculateRoomAreas(houseData)
);


// TEST 4: UNALLOCATED AREA

console.log("\nTEST 4: Unallocated Area");

console.log(
  calculateUnallocatedArea(houseData),
  "m2"
);


// TEST 5: COMPLETE MEASUREMENT REPORT

console.log("\nTEST 5: Complete Report");

console.log(
  JSON.stringify(
    calculateBuildingMeasurements(houseData),
    null,
    2
  )
);
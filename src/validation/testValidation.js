import { houseData } from "../data/houseData.js";

import { validateHouse } from "./houseValidator.js";


// TEST 1: ORIGINAL HOUSE

console.log("\n========== TEST 1 ==========");

const result1 = validateHouse(houseData);

console.log("Original House:");
console.log(JSON.stringify(result1, null, 2));


// TEST 2: INVALID BUILDING WIDTH

console.log("\n========== TEST 2 ==========");

const invalidHouse = structuredClone(houseData);

invalidHouse.dimensions.width = -5;

const result2 = validateHouse(invalidHouse);

console.log("Invalid Building:");
console.log(JSON.stringify(result2, null, 2));


// TEST 3: ROOM OUTSIDE BUILDING

console.log("\n========== TEST 3 ==========");

const invalidRoom = structuredClone(houseData);

invalidRoom.rooms[0].x = 10;

const result3 = validateHouse(invalidRoom);

console.log("Invalid Room:");
console.log(JSON.stringify(result3, null, 2));


// TEST 4: INVALID DOOR

console.log("\n========== TEST 4 ==========");

const invalidDoor = structuredClone(houseData);

invalidDoor.doors[0].height = 5;

const result4 = validateHouse(invalidDoor);

console.log("Invalid Door:");
console.log(JSON.stringify(result4, null, 2));


// TEST 5: INVALID WINDOW

console.log("\n========== TEST 5 ==========");

const invalidWindow = structuredClone(houseData);

invalidWindow.windows[0].width = -2;

const result5 = validateHouse(invalidWindow);

console.log("Invalid Window:");
console.log(JSON.stringify(result5, null, 2));
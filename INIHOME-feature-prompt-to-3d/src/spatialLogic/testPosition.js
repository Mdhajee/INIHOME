
import { houseData } from "../data/houseData";
import { checkFurniturePosition } from "./position";

const testFurniture = {
  type: "Chair",
  roomName: "Living Room",
  position: {
    x: -2,
    y: 0,
    z: -1.5,
  },
  rotation: 0,
};

const result = checkFurniturePosition(
  testFurniture,
  houseData.rooms,
  houseData.dimensions
);

console.log("Position Test Result:", result);

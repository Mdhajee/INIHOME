
// Furniture dimensions used in the existing House3D.jsx
function getFurnitureDimensions(type) {
  if (type === "Chair") {
    return { width: 0.8, depth: 0.8 };
  }

  if (type === "Table") {
    return { width: 1.8, depth: 1.2 };
  }

  // Existing project uses these dimensions for other furniture
  return { width: 1.8, depth: 2.2 };
}

// Check whether furniture is completely inside its assigned room
export function checkFurniturePosition(item, rooms, houseDimensions) {
  const room = rooms.find(
    (room) => room.name === item.roomName
  );

  if (!room) {
    return {
      valid: false,
      message: "Assigned room not found",
    };
  }

  const furniture = getFurnitureDimensions(item.type);

  // Convert centred 3D coordinates into floor-plan coordinates
  const planX = item.position.x + houseDimensions.width / 2;
  const planZ = item.position.z + houseDimensions.depth / 2;

  // Account for furniture rotation
  const angle = item.rotation ?? 0;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));

  const halfWidth =
    (furniture.width * cos + furniture.depth * sin) / 2;

  const halfDepth =
    (furniture.width * sin + furniture.depth * cos) / 2;

  const left = planX - halfWidth;
  const right = planX + halfWidth;
  const top = planZ - halfDepth;
  const bottom = planZ + halfDepth;

  const inside =
    left >= room.x &&
    right <= room.x + room.width &&
    top >= room.z &&
    bottom <= room.z + room.depth;

  return {
    valid: inside,
    roomName: room.name,
    message: inside
      ? "Furniture is inside the room"
      : "Furniture is outside the room boundary",
  };
}

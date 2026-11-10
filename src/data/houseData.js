
export const houseData = {
  name: "IniHome Sample House",

  dimensions: {
    width: 8,
    depth: 6,
    height: 3,
    wallThickness: 0.18,
  },

  rooms: [
    {
      id: "room-1",
      name: "Living Room",
      x: 0,
      z: 0,
      width: 4,
      depth: 3,
    },
    {
      id: "room-2",
      name: "Bedroom",
      x: 4,
      z: 0,
      width: 4,
      depth: 3,
    },
    {
      id: "room-3",
      name: "Kitchen",
      x: 0,
      z: 3,
      width: 4,
      depth: 3,
    },
    {
      id: "room-4",
      name: "Dining Room",
      x: 4,
      z: 3,
      width: 4,
      depth: 3,
    },
  ],

  doors: [
    {
      id: "door-1",
      name: "Main Door",
      x: 3.2,
      z: 6,
      width: 1.4,
      height: 2.1,
    },
  ],

  windows: [
    {
      id: "window-1",
      x: 1.5,
      z: 6,
      width: 1.3,
      height: 1.1,
    },
    {
      id: "window-2",
      x: 6.5,
      z: 6,
      width: 1.3,
      height: 1.1,
    },
  ],
};

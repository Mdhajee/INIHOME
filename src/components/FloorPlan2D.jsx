
import { houseData } from "../data/houseData";

function FloorPlan2D() {
  const { dimensions, rooms, doors, windows } = houseData;

  const scale = 90;
  const padding = 70;

  const planWidth = dimensions.width * scale;
  const planDepth = dimensions.depth * scale;

  return (
    <div className="floorplan-container">
      <svg
        viewBox={`0 0 ${planWidth + padding * 2} ${planDepth + padding * 2}`}
        className="floorplan-svg"
      >
        <defs>
          <pattern
            id="floorGrid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#dbe3ee"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#floorGrid)"
        />

        {/* Room areas */}
        {rooms.map((room) => (
          <g key={room.id}>
            <rect
              x={padding + room.x * scale}
              y={padding + room.z * scale}
              width={room.width * scale}
              height={room.depth * scale}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="2"
            />

            <text
              x={padding + (room.x + room.width / 2) * scale}
              y={padding + (room.z + room.depth / 2) * scale}
              textAnchor="middle"
              fontSize="16"
              fill="#475569"
            >
              {room.name}
            </text>
          </g>
        ))}

        {/* External boundary */}
        <rect
          x={padding}
          y={padding}
          width={planWidth}
          height={planDepth}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />

        {/* Main door symbol */}
        {doors.map((door) => (
          <g key={door.id}>
            <rect
              x={padding + door.x * scale}
              y={padding + door.z * scale - 5}
              width={door.width * scale}
              height="10"
              fill="#ffffff"
            />

            <path
              d={`M ${padding + door.x * scale} ${padding + door.z * scale}
                  L ${padding + door.x * scale} ${padding + (door.z - door.width) * scale}`}
              stroke="#8b5a35"
              strokeWidth="3"
              fill="none"
            />
          </g>
        ))}

        {/* Windows */}
        {windows.map((window) => (
          <rect
            key={window.id}
            x={padding + (window.x - window.width / 2) * scale}
            y={padding + window.z * scale - 5}
            width={window.width * scale}
            height="10"
            fill="#60a5fa"
            stroke="#2563eb"
            strokeWidth="2"
          />
        ))}

        {/* Dimensions */}
        <text
          x={padding + planWidth / 2}
          y={padding - 25}
          textAnchor="middle"
          fontSize="15"
          fill="#334155"
        >
          {dimensions.width} m
        </text>

        <text
          x={padding - 25}
          y={padding + planDepth / 2}
          textAnchor="middle"
          fontSize="15"
          fill="#334155"
          transform={`rotate(-90 ${padding - 25} ${padding + planDepth / 2})`}
        >
          {dimensions.depth} m
        </text>
      </svg>
    </div>
  );
}

export default FloorPlan2D;

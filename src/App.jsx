import { useCallback, useEffect, useState } from "react";
import { houseData } from "./data/houseData";

import {
  Box,
  MousePointer2,
  Move,
  RotateCw,
  Sofa,
  Paintbrush,
  Layers,
  Plus,
  Undo2,
  Redo2,
  Save,
  Download,
  Settings,
  Ruler,
  Armchair,
  Table,
  BedDouble,
  X,
} from "lucide-react";

import House3D from "./components/House3D";
import FloorPlan2D from "./components/FloorPlan2D";
import { validateHouse } from "./validation/houseValidator.js";

import {
  calculateBuildingMeasurements,
} from "./validation/measurementCalculator.js";

import "./App.css";

function App() {
  // INITIAL EDITOR DATA
  const STORAGE_KEY = "inihome-project-v1";

  const initialEditorState = {
    furnitureItems: [],
    objectTransforms: {},
    layerVisibility: {
      walls: true,
      floor: true,
      roof: true,
      doors: true,
      windows: true,
      furniture: true,
    },
    materialColors: {
      wall: "#f1e9dc",
      floor: "#c6a77b",
      roof: "#64748b",
    },
  };

  // LOAD THE LAST SAVED PROJECT WHEN THE APP OPENS
  const [history, setHistory] = useState(() => {
    try {
      const savedProject = localStorage.getItem(STORAGE_KEY);

      if (savedProject) {
        const parsedProject = JSON.parse(savedProject);

        if (
          parsedProject.history &&
          parsedProject.history.present &&
          Array.isArray(parsedProject.history.past) &&
          Array.isArray(parsedProject.history.future)
        ) {
          return parsedProject.history;
        }
      }
    } catch (error) {
      console.error("Unable to load saved project:", error);
    }

    return {
      past: [],
      present: initialEditorState,
      future: [],
    };
  });

  // SAVE STATUS MESSAGE
  const [saveStatus, setSaveStatus] = useState("Auto-save enabled");

  // AUTOMATICALLY SAVE THE PROJECT WHEN ITS STATE CHANGES
  useEffect(() => {
    try {
      const projectData = {
        version: 1,
        history,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      setSaveStatus("All changes saved");
    } catch (error) {
      console.error("Unable to save project:", error);
      setSaveStatus("Auto-save failed");
    }
  }, [history]);

  // MANUALLY SAVE THE CURRENT PROJECT
  function handleSaveProject() {
    try {
      const projectData = {
        version: 1,
        history,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      setSaveStatus("Project saved successfully!");
    } catch (error) {
      console.error("Unable to save project:", error);
      setSaveStatus("Unable to save project");
    }
  }

  // CURRENT EDITOR STATE
  const {
    furnitureItems,
    objectTransforms,
    layerVisibility,
    materialColors,
  } = history.present;

  // OTHER UI STATES
  const [viewMode, setViewMode] = useState("3D");
  const [activeTool, setActiveTool] = useState("Select");
  const [selectedObject, setSelectedObject] = useState(null);

  const [showFurnitureMenu, setShowFurnitureMenu] = useState(false);
  const [showMaterialsMenu, setShowMaterialsMenu] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState("Living Room");

  // MEMBER 2: ARCHITECTURAL VALIDATION
  const validationResult = validateHouse(houseData);

  // MEMBER 2: BUILDING MEASUREMENTS
  const measurementReport = calculateBuildingMeasurements(houseData);

  // CHECK WHETHER UNDO / REDO IS AVAILABLE
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // SAVE AN EDITING ACTION TO HISTORY
  const updateEditorState = useCallback((updater) => {
    setHistory((previous) => {
      const nextState =
        typeof updater === "function"
          ? updater(previous.present)
          : updater;

      return {
        past: [
          ...previous.past,
          previous.present,
        ].slice(-50),
        present: nextState,
        future: [],
      };
    });
  }, []);

  // RECORD A COMPLETED 3D MOVE OR ROTATION
  const handleTransformCommit = useCallback(
    (transformChange) => {
      if (!transformChange?.historyId) return;

      updateEditorState((previous) => ({
        ...previous,
        objectTransforms: {
          ...previous.objectTransforms,
          [transformChange.historyId]: {
            position: { ...transformChange.position },
            rotation: { ...transformChange.rotation },
          },
        },
      }));
    },
    [updateEditorState]
  );

  // UNDO LAST ACTION
  function handleUndo() {
    setHistory((previous) => {
      if (previous.past.length === 0) {
        return previous;
      }

      const previousState =
        previous.past[previous.past.length - 1];

      return {
        past: previous.past.slice(0, -1),
        present: previousState,
        future: [
          previous.present,
          ...previous.future,
        ],
      };
    });

    setSelectedObject(null);
  }

  // REDO LAST UNDONE ACTION
  function handleRedo() {
    setHistory((previous) => {
      if (previous.future.length === 0) {
        return previous;
      }

      const nextState = previous.future[0];

      return {
        past: [
          ...previous.past,
          previous.present,
        ],
        present: nextState,
        future: previous.future.slice(1),
      };
    });

    setSelectedObject(null);
  }

  // LEFT TOOLBAR ITEMS
  const tools = [
    { name: "Select", icon: MousePointer2 },
    { name: "Move", icon: Move },
    { name: "Rotate", icon: RotateCw },
    { name: "Furniture", icon: Sofa },
    { name: "Materials", icon: Paintbrush },
    { name: "Layers", icon: Layers },
    { name: "Add", icon: Plus },
  ];

  // HANDLE TOOL SELECTION
  function handleToolClick(toolName) {
    setActiveTool(toolName);

    setShowFurnitureMenu(toolName === "Furniture");
    setShowMaterialsMenu(toolName === "Materials");
    setShowLayersMenu(toolName === "Layers");
  }

  // ADD FURNITURE
  function addFurniture(type) {
    const room = houseData.rooms.find(
      (item) => item.name === selectedRoom
    );

    if (!room) return;

    const x =
      room.x +
      room.width / 2 -
      houseData.dimensions.width / 2;

    const z =
      room.z +
      room.depth / 2 -
      houseData.dimensions.depth / 2;

    const newFurniture = {
      id: Date.now(),
      type,
      name: `${type} ${furnitureItems.length + 1}`,
      roomName: room.name,
      position: {
        x,
        y: 0,
        z,
      },
      rotation: 0,
    };

    updateEditorState((previous) => ({
      ...previous,
      furnitureItems: [
        ...previous.furnitureItems,
        newFurniture,
      ],
    }));

    setShowFurnitureMenu(false);
    setActiveTool("Select");
  }

  // SHOW / HIDE LAYERS
  function toggleLayer(layerName) {
    updateEditorState((previous) => ({
      ...previous,
      layerVisibility: {
        ...previous.layerVisibility,
        [layerName]: !previous.layerVisibility[layerName],
      },
    }));
  }

  // CHANGE MATERIAL COLOUR
  function changeMaterial(category, color) {
    updateEditorState((previous) => ({
      ...previous,
      materialColors: {
        ...previous.materialColors,
        [category]: color,
      },
    }));
  }

  // TOP ROOF BUTTON
  function toggleRoof() {
    toggleLayer("roof");
  }

  return (
    <div className="studio">

      {/* TOP HEADER */}
      <header className="topbar">

        <div className="brand">
          <Box size={30} />

          <div>
            <h2>IniHome</h2>
            <span>3D Studio</span>
          </div>
        </div>

        <div className="top-actions">

          <button
            className={viewMode === "2D" ? "active" : ""}
            onClick={() => setViewMode("2D")}
          >
            2D
          </button>

          <button
            className={viewMode === "3D" ? "active" : ""}
            onClick={() => setViewMode("3D")}
          >
            3D
          </button>

          {/* UNDO BUTTON */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo last action"
            style={{
              opacity: canUndo ? 1 : 0.45,
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
          >
            <Undo2 size={17} />
            Undo
          </button>

          {/* REDO BUTTON */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo last undone action"
            style={{
              opacity: canRedo ? 1 : 0.45,
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
          >
            <Redo2 size={17} />
            Redo
          </button>

          {/* SAVE PROJECT BUTTON */}
          <button
            type="button"
            onClick={handleSaveProject}
            title="Save current project"
          >
            <Save size={17} />
            Save
          </button>

          {/* SAVE STATUS */}
          <span
            style={{
              fontSize: "12px",
              color: "#15803d",
              marginLeft: "5px",
            }}
          >
            {saveStatus}
          </span>

          <button type="button">
            <Download size={17} />
            Export GLB
          </button>

        </div>
      </header>

      {/* MAIN EDITOR */}
      <main className="editor-layout">

        {/* LEFT TOOLBAR */}
        <aside className="left-toolbar">

          <p className="panel-label">TOOLS</p>

          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <button
                type="button"
                key={tool.name}
                className={
                  activeTool === tool.name
                    ? "tool-button selected"
                    : "tool-button"
                }
                onClick={() => handleToolClick(tool.name)}
              >
                <Icon size={23} />
                <span>{tool.name}</span>
              </button>
            );
          })}

        </aside>

        {/* CENTRAL WORKSPACE */}
        <section className="workspace">

          <div className="workspace-heading">

            <div>
              <h1>{viewMode} House Visualization</h1>
              <p>Design and customize your house</p>
            </div>

            <div className="workspace-controls">

              <span className="view-indicator">
                Active: {activeTool}
              </span>

              {viewMode === "3D" && (
                <button
                  className="roof-toggle"
                  onClick={toggleRoof}
                >
                  {layerVisibility.roof
                    ? "Hide Roof"
                    : "Show Roof"}
                </button>
              )}

            </div>
          </div>

          {/* FURNITURE MENU */}
          {showFurnitureMenu && (
            <div className="furniture-menu">

              <div className="furniture-menu-header">
                <h3>Add Furniture</h3>

                <button
                  type="button"
                  onClick={() => setShowFurnitureMenu(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <label htmlFor="room-select">
                Select Room
              </label>

              <select
                id="room-select"
                value={selectedRoom}
                onChange={(event) =>
                  setSelectedRoom(event.target.value)
                }
              >
                {houseData.rooms.map((room) => (
                  <option
                    key={room.id}
                    value={room.name}
                  >
                    {room.name}
                  </option>
                ))}
              </select>

              <div className="furniture-options">

                <button
                  type="button"
                  onClick={() => addFurniture("Chair")}
                >
                  <Armchair size={25} />
                  <span>Chair</span>
                </button>

                <button
                  type="button"
                  onClick={() => addFurniture("Table")}
                >
                  <Table size={25} />
                  <span>Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => addFurniture("Bed")}
                >
                  <BedDouble size={25} />
                  <span>Bed</span>
                </button>

              </div>
            </div>
          )}

          {/* MATERIALS MENU */}
          {showMaterialsMenu && (
            <div className="furniture-menu materials-menu">

              <div className="furniture-menu-header">
                <h3>Materials Editor</h3>

                <button
                  type="button"
                  onClick={() => setShowMaterialsMenu(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* WALL COLOURS */}
              <div className="material-category">
                <h4>Wall Colour</h4>

                <div className="color-options">
                  {[
                    "#f1e9dc",
                    "#ffffff",
                    "#d6c2a5",
                    "#b8c9d9",
                    "#c7b6d8",
                    "#9ca3af",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Set wall colour to ${color}`}
                      className={
                        materialColors.wall === color
                          ? "color-selected"
                          : ""
                      }
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        changeMaterial("wall", color)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* FLOOR COLOURS */}
              <div className="material-category">
                <h4>Floor Colour</h4>

                <div className="color-options">
                  {[
                    "#c6a77b",
                    "#a66b3f",
                    "#d6d3d1",
                    "#78716c",
                    "#b9a58a",
                    "#e5d5b5",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Set floor colour to ${color}`}
                      className={
                        materialColors.floor === color
                          ? "color-selected"
                          : ""
                      }
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        changeMaterial("floor", color)
                      }
                    />
                  ))}
                </div>
              </div>

              {/* ROOF COLOURS */}
              <div className="material-category">
                <h4>Roof Colour</h4>

                <div className="color-options">
                  {[
                    "#64748b",
                    "#374151",
                    "#7c2d12",
                    "#475569",
                    "#9ca3af",
                    "#1e293b",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      aria-label={`Set roof colour to ${color}`}
                      className={
                        materialColors.roof === color
                          ? "color-selected"
                          : ""
                      }
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        changeMaterial("roof", color)
                      }
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* LAYERS MENU */}
          {showLayersMenu && (
            <div className="furniture-menu layers-menu">

              <div className="furniture-menu-header">
                <h3>Layers</h3>

                <button
                  type="button"
                  onClick={() => setShowLayersMenu(false)}
                  aria-label="Close layers panel"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="layers-description">
                Show or hide parts of the 3D house.
              </p>

              {[
                { key: "walls", label: "Walls" },
                { key: "floor", label: "Floor" },
                { key: "roof", label: "Roof" },
                { key: "doors", label: "Doors" },
                { key: "windows", label: "Windows" },
                { key: "furniture", label: "Furniture" },
              ].map((layer) => (
                <button
                  key={layer.key}
                  type="button"
                  className="layer-toggle-row"
                  onClick={() => toggleLayer(layer.key)}
                  aria-pressed={layerVisibility[layer.key]}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    marginTop: "8px",
                    border: "1px solid #dbe3ef",
                    borderRadius: "8px",
                    background: "white",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <span>{layer.label}</span>

                  <span
                    style={{
                      color: layerVisibility[layer.key]
                        ? "#15803d"
                        : "#64748b",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {layerVisibility[layer.key]
                      ? "Visible"
                      : "Hidden"}
                  </span>
                </button>
              ))}

            </div>
          )}

          {/* HOUSE VIEWPORT */}
          <div className="viewport">

            {viewMode === "3D" ? (

              <House3D
                showRoof={layerVisibility.roof}
                onSelect={setSelectedObject}
                activeTool={activeTool}
                furnitureItems={furnitureItems}
                materialColors={materialColors}
                layerVisibility={layerVisibility}
                objectTransforms={objectTransforms}
                onTransformCommit={handleTransformCommit}
              />

            ) : (

              <FloorPlan2D />

            )}

          </div>

        </section>

                {/* RIGHT PROPERTIES PANEL */}
        <aside className="properties-panel">

          <h2>Properties</h2>

          {/* OBJECT INFORMATION */}
          <div className="property-section">

            <h4>OBJECT INFORMATION</h4>

            {selectedObject ? (
              <>
                <p>
                  <strong>Name:</strong> {selectedObject.name}
                </p>

                <p>
                  <strong>Type:</strong> {selectedObject.type}
                </p>
              </>
            ) : (
              <p>No object selected</p>
            )}

          </div>

          {/* DIMENSIONS */}
          <div className="property-section">

            <h4>DIMENSIONS</h4>

            {selectedObject ? (
              <>
                <p>
                  Width: {selectedObject.dimensions.width.toFixed(2)} m
                </p>

                <p>
                  Height: {selectedObject.dimensions.height.toFixed(2)} m
                </p>

                <p>
                  Depth: {selectedObject.dimensions.depth.toFixed(2)} m
                </p>
              </>
            ) : (
              <>
                <p>Width: --</p>
                <p>Height: --</p>
                <p>Depth: --</p>
              </>
            )}

          </div>

          {/* POSITION */}
          <div className="property-section">

            <h4>POSITION</h4>

            {selectedObject ? (
              <>
                <p>
                  X: {selectedObject.position.x.toFixed(2)}
                </p>

                <p>
                  Y: {selectedObject.position.y.toFixed(2)}
                </p>

                <p>
                  Z: {selectedObject.position.z.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <p>X: --</p>
                <p>Y: --</p>
                <p>Z: --</p>
              </>
            )}

          </div>

          {/* MEMBER 2: ARCHITECTURAL VALIDATION */}

          <div className="property-section">
            <h4>ARCHITECTURAL VALIDATION</h4>

            <p
              style={{
                color: validationResult.valid ? "#15803d" : "#dc2626",
                fontWeight: 700,
              }}
            >
              Status: {validationResult.valid ? "Valid Design" : "Invalid Design"}
            </p>

            <p>Checks performed: {validationResult.summary.totalChecks}</p>

            <p>Passed: {validationResult.summary.passed}</p>

            <p>Failed: {validationResult.summary.failed}</p>

            {validationResult.errors.map((error, index) => (
              <p
                key={`error-${index}`}
                style={{ color: "#dc2626", fontSize: "12px" }}
              >
                {error.element}: {error.message}
              </p>
            ))}

            {validationResult.warnings.map((warning, index) => (
              <p
                key={`warning-${index}`}
                style={{ color: "#d97706", fontSize: "12px" }}
              >
                Warning: {warning}
              </p>
            ))}
          </div>

          {/* MEMBER 2: BUILDING MEASUREMENTS */}

          <div className="property-section">
            <h4>BUILDING MEASUREMENTS</h4>

            <p>
              Floor Area: {measurementReport.building.floorArea} m²
            </p>

            <p>
              Building Volume: {measurementReport.building.volume} m³
            </p>

            <p>
              Total Room Area: {measurementReport.summary.totalRoomArea} m²
            </p>

            <p>
              Unallocated Area: {measurementReport.summary.unallocatedArea} m²
            </p>

            <p>
              Room Coverage: {measurementReport.summary.roomCoveragePercentage}%
            </p>

            <p>
              Gross Wall Area: {measurementReport.summary.grossExternalWallArea} m²
            </p>

            <p>
              Net Wall Area: {measurementReport.summary.netExternalWallArea} m²
            </p>

            <h4 style={{ marginTop: "15px" }}>ROOM AREAS</h4>

            {measurementReport.rooms.map((room) => (
              <p key={room.id}>
                {room.name}: {room.area} m²
              </p>
            ))}
          </div>

          {/* OTHER SETTINGS */}
          <div className="property-section">

            <h4>OTHER SETTINGS</h4>

            <p>
              <Ruler size={15} />
              Object settings
            </p>

            <p>
              <Settings size={15} />
              Advanced properties
            </p>

            <p>
              Furniture added: {furnitureItems.length}
            </p>

            <p>
              Undo history: {history.past.length} actions
            </p>

          </div>

        </aside>

      </main>
    </div>
  );
}

export default App;
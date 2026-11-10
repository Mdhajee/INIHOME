
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { houseData } from "../data/houseData";

function House3D({
  showRoof = true,
  onSelect,
  activeTool = "Select",
  furnitureItems = [],
  materialColors = {},
  layerVisibility = {},
  objectTransforms = {},
  onTransformCommit,
}) {
  const containerRef = useRef(null);

  const activeToolRef = useRef(activeTool);
  const selectedMeshRef = useRef(null);
  const transformControlsRef = useRef(null);

  // KEEP THE CURRENTLY SELECTED TOOL UPDATED
  useEffect(() => {
    activeToolRef.current = activeTool;

    const transformControls = transformControlsRef.current;
    const selectedMesh = selectedMeshRef.current;

    if (!transformControls) return;

    if (
      selectedMesh &&
      (activeTool === "Move" || activeTool === "Rotate")
    ) {
      transformControls.attach(selectedMesh);

      transformControls.setMode(
        activeTool === "Move" ? "translate" : "rotate"
      );
    } else {
      transformControls.detach();
    }
  }, [activeTool]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // HOUSE DATA
    const { dimensions, rooms, doors, windows } = houseData;

    const houseWidth = dimensions.width;
    const houseDepth = dimensions.depth;
    const wallHeight = dimensions.height;
    const wallThickness = dimensions.wallThickness;

    const frontZ = houseDepth / 2;
    const backZ = -houseDepth / 2;
    const leftX = -houseWidth / 2;
    const rightX = houseWidth / 2;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dce8f2");

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    camera.position.set(10, 8, 11);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // ORBIT CONTROLS
    const controls = new OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enableDamping = true;
    controls.target.set(0, wallHeight / 2, 0);
    controls.maxPolarAngle = Math.PI / 2.05;

    // LIGHTING
    scene.add(
      new THREE.AmbientLight(0xffffff, 1.5)
    );

    const sunlight = new THREE.DirectionalLight(
      0xffffff,
      2.5
    );

    sunlight.position.set(8, 12, 8);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    scene.add(sunlight);

    // GROUND
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: "#dce5d5",
        roughness: 0.9,
      })
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    scene.add(ground);

    // GRID
    const grid = new THREE.GridHelper(
      30,
      30,
      "#94a3b8",
      "#cbd5e1"
    );

    grid.position.y = -0.1;
    scene.add(grid);

    // MATERIALS
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: materialColors.wall || "#f1e9dc",
      roughness: 0.85,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: materialColors.floor || "#c6a77b",
      roughness: 0.85,
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: materialColors.roof || "#64748b",
      roughness: 0.85,
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: "#60a5fa",
      metalness: 0.15,
      roughness: 0.2,
    });

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#8b5a35",
    });

    const internalWallMaterial = new THREE.MeshStandardMaterial({
      color: materialColors.wall || "#e8d9c8",
      roughness: 0.9,
    });

    // STABLE IDS FOR HOUSE OBJECTS
    let objectCounter = 0;

    // APPLY A PREVIOUSLY SAVED TRANSFORM
    function applySavedTransform(object, historyId) {
      const savedTransform = objectTransforms[historyId];

      if (savedTransform?.position) {
        object.position.set(
          savedTransform.position.x,
          savedTransform.position.y,
          savedTransform.position.z
        );
      }

      if (savedTransform?.rotation) {
        object.rotation.set(
          savedTransform.rotation.x ?? 0,
          savedTransform.rotation.y ?? 0,
          savedTransform.rotation.z ?? 0
        );
      }

      object.userData.historyId = historyId;
    }

    // CREATE BOX WITH OBJECT INFORMATION
    function createBox(
      width,
      height,
      depth,
      material,
      x,
      y,
      z,
      objectName,
      objectType
    ) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
      );

      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const historyId = `house-object-${objectCounter++}`;

      mesh.userData = {
        selectable: true,
        name: objectName,
        type: objectType,
        historyId,
        dimensions: {
          width,
          height,
          depth,
        },
        position: {
          x,
          y,
          z,
        },
      };

      applySavedTransform(mesh, historyId);

      // ASSIGN OBJECT TO ITS VISIBILITY LAYER
      const layerKey =
        objectType === "floor" ? "floor" :
        objectType === "wall" ? "walls" :
        objectType === "roof" ? "roof" :
        objectType === "door" || objectType === "handle" ? "doors" :
        objectType === "window" ? "windows" : null;

      if (layerKey) {
        mesh.visible = layerVisibility[layerKey] !== false;
      }

      scene.add(mesh);
      return mesh;
    }

    // CREATE FURNITURE MODELS
    function createFurniture(item) {
      const group = new THREE.Group();

      const woodMaterial = new THREE.MeshStandardMaterial({
        color: "#a66b3f",
        roughness: 0.8,
      });

      const cushionMaterial = new THREE.MeshStandardMaterial({
        color: "#64748b",
        roughness: 0.9,
      });

      function addPart(
        width,
        height,
        depth,
        x,
        y,
        z,
        material
      ) {
        const part = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          material
        );

        part.position.set(x, y, z);
        part.castShadow = true;
        part.receiveShadow = true;

        part.userData.selectable = true;
        part.userData.furnitureParent = group;

        group.add(part);
      }

      if (item.type === "Chair") {
        // CHAIR SEAT
        addPart(
          0.8, 0.12, 0.8,
          0, 0.5, 0,
          cushionMaterial
        );

        // CHAIR BACKREST
        addPart(
          0.8, 0.9, 0.12,
          0, 1.0, -0.34,
          woodMaterial
        );

        // FOUR CHAIR LEGS
        addPart(
          0.12, 0.5, 0.12,
          -0.3, 0.25, -0.3,
          woodMaterial
        );

        addPart(
          0.12, 0.5, 0.12,
          0.3, 0.25, -0.3,
          woodMaterial
        );

        addPart(
          0.12, 0.5, 0.12,
          -0.3, 0.25, 0.3,
          woodMaterial
        );

        addPart(
          0.12, 0.5, 0.12,
          0.3, 0.25, 0.3,
          woodMaterial
        );
      }

      if (item.type === "Table") {
        // TABLETOP
        addPart(
          1.8, 0.15, 1.2,
          0, 0.9, 0,
          woodMaterial
        );

        // TABLE LEGS
        addPart(
          0.12, 0.9, 0.12,
          -0.75, 0.45, -0.45,
          woodMaterial
        );

        addPart(
          0.12, 0.9, 0.12,
          0.75, 0.45, -0.45,
          woodMaterial
        );

        addPart(
          0.12, 0.9, 0.12,
          -0.75, 0.45, 0.45,
          woodMaterial
        );

        addPart(
          0.12, 0.9, 0.12,
          0.75, 0.45, 0.45,
          woodMaterial
        );
      }

      if (item.type === "Bed") {
        // BED FRAME
        addPart(
          1.8, 0.3, 2.2,
          0, 0.25, 0,
          woodMaterial
        );

        // MATTRESS
        addPart(
          1.7, 0.2, 2.1,
          0, 0.5, 0,
          cushionMaterial
        );

        // HEADBOARD
        addPart(
          1.8, 0.9, 0.15,
          0, 0.65, -1.1,
          woodMaterial
        );
      }

      group.position.set(
        item.position?.x ?? 0,
        item.position?.y ?? 0,
        item.position?.z ?? 0
      );

      group.rotation.y = item.rotation ?? 0;

      const historyId = `furniture-${item.id}`;

      group.userData = {
        selectable: true,
        furnitureRoot: true,
        id: item.id,
        historyId,
        name: item.name,
        type: "furniture",
        dimensions:
          item.type === "Chair"
            ? { width: 0.8, height: 1.4, depth: 0.8 }
            : item.type === "Table"
            ? { width: 1.8, height: 1.05, depth: 1.2 }
            : { width: 1.8, height: 1.1, depth: 2.2 },
        position: { ...group.position },
      };

      applySavedTransform(group, historyId);

      // MARK ALL FURNITURE PARTS AS BELONGING TO THIS GROUP
      group.traverse((part) => {
        if (part.isMesh) {
          part.userData.furnitureParent = group;
        }
      });

      group.visible = layerVisibility.furniture !== false;
      scene.add(group);
    }

    // FLOOR SLAB
    createBox(
      houseWidth,
      0.2,
      houseDepth,
      floorMaterial,
      0,
      0,
      0,
      "Ground Floor",
      "floor"
    );

    // WALL POSITION
    const wallCenterY = wallHeight / 2 + 0.1;

    // BACK WALL
    createBox(
      houseWidth,
      wallHeight,
      wallThickness,
      wallMaterial,
      0,
      wallCenterY,
      backZ,
      "Back Wall",
      "wall"
    );

    // LEFT WALL
    createBox(
      wallThickness,
      wallHeight,
      houseDepth,
      wallMaterial,
      leftX,
      wallCenterY,
      0,
      "Left Wall",
      "wall"
    );

    // RIGHT WALL
    createBox(
      wallThickness,
      wallHeight,
      houseDepth,
      wallMaterial,
      rightX,
      wallCenterY,
      0,
      "Right Wall",
      "wall"
    );

    // FRONT WALL WITH ENTRANCE OPENING
    const entrance = doors[0];

    const doorLeft = entrance
      ? entrance.x - houseWidth / 2
      : -0.7;

    const doorRight = entrance
      ? doorLeft + entrance.width
      : 0.7;

    const leftWallWidth = doorLeft - leftX;
    const rightWallWidth = rightX - doorRight;

    // FRONT WALL LEFT
    createBox(
      leftWallWidth,
      wallHeight,
      wallThickness,
      wallMaterial,
      leftX + leftWallWidth / 2,
      wallCenterY,
      frontZ,
      "Front Wall Left",
      "wall"
    );

    // FRONT WALL RIGHT
    createBox(
      rightWallWidth,
      wallHeight,
      wallThickness,
      wallMaterial,
      doorRight + rightWallWidth / 2,
      wallCenterY,
      frontZ,
      "Front Wall Right",
      "wall"
    );

    // ENTRANCE LINTEL AND DOOR
    if (entrance) {
      const lintelHeight = wallHeight - entrance.height;

      if (lintelHeight > 0) {
        createBox(
          entrance.width,
          lintelHeight,
          wallThickness,
          wallMaterial,
          (doorLeft + doorRight) / 2,
          0.1 + entrance.height + lintelHeight / 2,
          frontZ,
          "Entrance Lintel",
          "wall"
        );
      }

      // MAIN ENTRANCE DOOR
      createBox(
        entrance.width,
        entrance.height,
        0.08,
        doorMaterial,
        (doorLeft + doorRight) / 2,
        0.1 + entrance.height / 2,
        frontZ - 0.06,
        "Main Entrance Door",
        "door"
      );

      // DOOR HANDLE
      createBox(
        0.05,
        0.12,
        0.06,
        new THREE.MeshStandardMaterial({
          color: "#eab308",
          metalness: 0.8,
        }),
        doorRight - 0.15,
        1.2,
        frontZ - 0.12,
        "Door Handle",
        "handle"
      );
    }

    // FRONT WINDOWS
    windows.forEach((window, index) => {
      const windowCenterX =
        window.x - houseWidth / 2;

      createBox(
        window.width,
        window.height,
        0.06,
        glassMaterial,
        windowCenterX,
        1.9,
        frontZ + 0.11,
        `Front Window ${index + 1}`,
        "window"
      );
    });

    // INTERNAL WALLS
    rooms.forEach((room, index) => {
      rooms.slice(index + 1).forEach((otherRoom) => {
        const roomRight = room.x + room.width;
        const otherRight = otherRoom.x + otherRoom.width;

        // VERTICAL SHARED BOUNDARY
        if (
          Math.abs(roomRight - otherRoom.x) < 0.01 ||
          Math.abs(otherRight - room.x) < 0.01
        ) {
          const boundaryX =
            Math.abs(roomRight - otherRoom.x) < 0.01
              ? roomRight
              : otherRight;

          const overlapStart = Math.max(
            room.z,
            otherRoom.z
          );

          const overlapEnd = Math.min(
            room.z + room.depth,
            otherRoom.z + otherRoom.depth
          );

          const overlapDepth = overlapEnd - overlapStart;

          if (overlapDepth > 0) {
            createBox(
              0.12,
              wallHeight,
              overlapDepth,
              internalWallMaterial,
              boundaryX - houseWidth / 2,
              wallCenterY,
              (overlapStart + overlapEnd) / 2 -
                houseDepth / 2,
              "Internal Wall",
              "wall"
            );
          }
        }

        // HORIZONTAL SHARED BOUNDARY
        if (
          Math.abs(
            room.z + room.depth - otherRoom.z
          ) < 0.01 ||
          Math.abs(
            otherRoom.z + otherRoom.depth - room.z
          ) < 0.01
        ) {
          const boundaryZ =
            Math.abs(
              room.z + room.depth - otherRoom.z
            ) < 0.01
              ? room.z + room.depth
              : otherRoom.z + otherRoom.depth;

          const overlapStart = Math.max(
            room.x,
            otherRoom.x
          );

          const overlapEnd = Math.min(
            room.x + room.width,
            otherRoom.x + otherRoom.width
          );

          const overlapWidth = overlapEnd - overlapStart;

          if (overlapWidth > 0) {
            createBox(
              overlapWidth,
              wallHeight,
              0.12,
              internalWallMaterial,
              (overlapStart + overlapEnd) / 2 -
                houseWidth / 2,
              wallCenterY,
              boundaryZ - houseDepth / 2,
              "Internal Wall",
              "wall"
            );
          }
        }
      });
    });

    // ROOF
    if (
      showRoof &&
      layerVisibility.roof !== false
    ) {
      createBox(
        houseWidth + 0.5,
        0.25,
        houseDepth + 0.5,
        roofMaterial,
        0,
        wallHeight + 0.25,
        0,
        "Main Roof",
        "roof"
      );
    }

    // ADD FURNITURE TO THE HOUSE
    furnitureItems.forEach((item) => {
      createFurniture(item);
    });

    // SELECTION HIGHLIGHT
    let selectionHelper = null;

    // TRANSFORM CONTROLS
    const transformControls = new TransformControls(
      camera,
      renderer.domElement
    );

    transformControls.setSize(0.8);
    transformControls.setSpace("world");

    scene.add(transformControls.getHelper());

    // STORE THE TRANSFORM BEFORE DRAGGING
    let transformBeforeDrag = null;

    transformControls.addEventListener(
      "dragging-changed",
      (event) => {
        controls.enabled = !event.value;

        const selectedMesh = selectedMeshRef.current;

        // DRAG STARTED
        if (event.value && selectedMesh) {
          transformBeforeDrag = {
            historyId: selectedMesh.userData.historyId,
            position: {
              x: selectedMesh.position.x,
              y: selectedMesh.position.y,
              z: selectedMesh.position.z,
            },
            rotation: {
              x: selectedMesh.rotation.x,
              y: selectedMesh.rotation.y,
              z: selectedMesh.rotation.z,
            },
          };
        }

        // DRAG ENDED
        if (
          !event.value &&
          selectedMesh &&
          transformBeforeDrag
        ) {
          const afterTransform = {
            historyId: selectedMesh.userData.historyId,
            position: {
              x: selectedMesh.position.x,
              y: selectedMesh.position.y,
              z: selectedMesh.position.z,
            },
            rotation: {
              x: selectedMesh.rotation.x,
              y: selectedMesh.rotation.y,
              z: selectedMesh.rotation.z,
            },
          };

          const before = transformBeforeDrag;
          transformBeforeDrag = null;

          // CHECK WHETHER THE OBJECT ACTUALLY CHANGED
          const changed =
            Math.abs(
              before.position.x - afterTransform.position.x
            ) > 0.0001 ||
            Math.abs(
              before.position.y - afterTransform.position.y
            ) > 0.0001 ||
            Math.abs(
              before.position.z - afterTransform.position.z
            ) > 0.0001 ||
            Math.abs(
              before.rotation.x - afterTransform.rotation.x
            ) > 0.0001 ||
            Math.abs(
              before.rotation.y - afterTransform.rotation.y
            ) > 0.0001 ||
            Math.abs(
              before.rotation.z - afterTransform.rotation.z
            ) > 0.0001;

          // SEND ONE COMPLETED TRANSFORM TO REACT HISTORY
          if (
            changed &&
            afterTransform.historyId &&
            onTransformCommit
          ) {
            onTransformCommit(afterTransform);
          }
        }
      }
    );

    // UPDATE PROPERTY PANEL AFTER MOVEMENT OR ROTATION
    function updateSelectedObject() {
      const selectedMesh = selectedMeshRef.current;

      if (!selectedMesh || !onSelect) return;

      selectedMesh.userData.position = {
        x: selectedMesh.position.x,
        y: selectedMesh.position.y,
        z: selectedMesh.position.z,
      };

      onSelect({
        ...selectedMesh.userData,
        position: { ...selectedMesh.userData.position },
      });

      if (selectionHelper) {
        selectionHelper.update();
      }
    }

    transformControls.addEventListener(
      "objectChange",
      updateSelectedObject
    );

    transformControlsRef.current = transformControls;

    // SELECT OBJECT
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handleCanvasClick(event) {
      if (transformControls.dragging) return;

      const bounds =
        renderer.domElement.getBoundingClientRect();

      mouse.x =
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1;

      mouse.y =
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const selectableObjects = [];

      scene.traverse((object) => {
        if (
          object.userData.selectable &&
          object.visible
        ) {
          selectableObjects.push(object);
        }
      });

      const intersections = raycaster.intersectObjects(
        selectableObjects,
        false
      );

      // REMOVE PREVIOUS SELECTION HIGHLIGHT
      if (selectionHelper) {
        scene.remove(selectionHelper);
        selectionHelper.geometry.dispose();
        selectionHelper.material.dispose();
        selectionHelper = null;
      }

      if (intersections.length > 0) {
        const clickedObject = intersections[0].object;

        const selected =
          clickedObject.userData.furnitureParent ||
          clickedObject;

        selectedMeshRef.current = selected;

        selectionHelper = new THREE.BoxHelper(
          selected,
          "#2563eb"
        );

        scene.add(selectionHelper);

        // ATTACH MOVEMENT OR ROTATION CONTROLS
        if (
          activeToolRef.current === "Move" ||
          activeToolRef.current === "Rotate"
        ) {
          transformControls.attach(selected);

          transformControls.setMode(
            activeToolRef.current === "Move"
              ? "translate"
              : "rotate"
          );
        } else {
          transformControls.detach();
        }

        if (onSelect) {
          onSelect({
            ...selected.userData,
            position: {
              x: selected.position.x,
              y: selected.position.y,
              z: selected.position.z,
            },
          });
        }
      } else {
        selectedMeshRef.current = null;
        transformControls.detach();

        if (onSelect) {
          onSelect(null);
        }
      }
    }

    renderer.domElement.addEventListener(
      "click",
      handleCanvasClick
    );

    // RESIZE HANDLING
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    });

    resizeObserver.observe(container);

    // ANIMATION
    let animationId;

    function animate() {
      animationId = requestAnimationFrame(animate);

      controls.update();

      if (selectionHelper) {
        selectionHelper.update();
      }

      renderer.render(scene, camera);
    }

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);

      resizeObserver.disconnect();
      controls.dispose();

      renderer.domElement.removeEventListener(
        "click",
        handleCanvasClick
      );

      transformControls.detach();

      transformControls.removeEventListener(
        "objectChange",
        updateSelectedObject
      );

      transformControls.dispose();

      transformControlsRef.current = null;
      selectedMeshRef.current = null;

      if (selectionHelper) {
        scene.remove(selectionHelper);
        selectionHelper.geometry.dispose();
        selectionHelper.material.dispose();
      }

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              material.dispose();
            });
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      if (onSelect) {
        onSelect(null);
      }
    };
  }, [
    showRoof,
    onSelect,
    furnitureItems,
    materialColors,
    layerVisibility,
    objectTransforms,
    onTransformCommit,
  ]);

  return (
    <div
      ref={containerRef}
      className="house-canvas"
    />
  );
}

export default House3D;

import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const gui = new dat.GUI();
let stats = new Stats();

const berlinJson = "../assets/planung_conv.geojson";
const berlinFwData2018Json = "../assets/BFw_planning_room_data_2018.json";
const berlinFwData2019Json = "../assets/BFw_planning_room_data_2019.json";
const berlinFwData2020Json = "../assets/BFw_planning_room_data_2020.json";
const berlinFwData2021Json = "../assets/BFw_planning_room_data_2021.json";
const berlinFwData2022Json = "../assets/BFw_planning_room_data_2022.json";
const berlinFwData2023Json = "../assets/BFw_planning_room_data_2023.json";
const berlinFwData2024Json = "../assets/BFw_planning_room_data_2024.json";
let berlinFwDataCurrentJson = berlinFwData2024Json;
let berlinGeo;
let fwData;
let lorMap;
let dataSubsetToDisplay = "mission_count_all";
let scene;

let barGraph = true;
let lineGraph = false;
let sphereGraph = false;
let sphereGraphHeight = false;
let sphereGraphLines = false;
let sphereGraphWHeightLines = false;

let mission_count_all_max = 0;
let mission_count_ems_max = 0;
let mission_count_ems_critical_max = 0;
let mission_count_ems_critical_cpr_max = 0;
let mission_count_fire_max = 0;
let mission_count_technical_rescue_max = 0;

//global Data Variables
let maxValueToDivideBy;
let whichMaxValue = "mission_count_all_max";
async function convertJsonToMapWithLorKey(jsonData) {
  const lorKeyMap = new Map();
  jsonData.forEach((element) => {
    lorKeyMap.set(element.planning_room_id, {
      mission_count_all: element.mission_count_all,
      mission_count_ems: element.mission_count_ems,
      mission_count_ems_critical: element.mission_count_ems_critical,
      mission_count_ems_critical_cpr: element.mission_count_ems_critical_cpr,
      mission_count_fire: element.mission_count_fire,
      mission_count_technical_rescue: element.mission_count_technical_rescue,
    });
    if (element.mission_count_all > mission_count_all_max) {
      mission_count_all_max = element.mission_count_all;
    }
    if (element.mission_count_ems > mission_count_ems_max) {
      mission_count_ems_max = element.mission_count_ems;
    }
    if (element.mission_count_ems_critical > mission_count_ems_critical_max) {
      mission_count_ems_critical_max = element.mission_count_ems_critical;
    }
    if (
      element.mission_count_ems_critical_cpr >
      mission_count_ems_critical_cpr_max
    ) {
      mission_count_ems_critical_cpr_max =
        element.mission_count_ems_critical_cpr;
    }
    if (element.mission_count_fire > mission_count_fire_max) {
      mission_count_fire_max = element.mission_count_fire;
    }
    if (
      element.mission_count_technical_rescue >
      mission_count_technical_rescue_max
    ) {
      mission_count_technical_rescue_max =
        element.mission_count_technical_rescue;
    }
  });
  console.log(lorKeyMap);
  return lorKeyMap;
}
const degreesToRads = (deg) => (deg * Math.PI) / 180.0;
function gpsToCart(lat, lon) {
  const cart = { x: 0, y: 0 };
  const earthRad = 6378;

  cart.x = degreesToRads(lon) * earthRad;
  cart.y =
    (earthRad / 2) *
    Math.log(
      (1.0 + Math.sin(degreesToRads(lat))) /
        (1.0 - Math.sin(degreesToRads(lat))),
    );
  return cart;
}

function colorPicker(value) {
  if (value > 0.9) {
    return 0xd20f39;
  } else if (value > 0.8) {
    return 0xe64553;
  } else if (value > 0.7) {
    return 0xfe640b;
  } else if (value > 0.6) {
    return 0xdf8e1d;
  } else if (value > 0.5) {
    return 0x40a02b;
  } else if (value > 0.4) {
    return 0x179299;
  } else if (value > 0.3) {
    return 0x04a5e5;
  } else if (value > 0.2) {
    return 0x209fb5;
  } else if (value > 0.1) {
    return 0x1e66f5;
  } else if (value > 0) {
    return 0x7287fd;
  }
  return 0x000000;
}
let controls = {
  scale: 10,
  isTransparent: true,
  opacity: 0.9,
  isWireframe: false,
};
const meshNormal = new THREE.MeshNormalMaterial({
  transparent: controls.isTransparent,
  opacity: controls.opacity,
  wireframe: controls.isWireframe,
});
let materialLine;
let exMaterial = meshNormal;

let pointsMaterial = new THREE.PointsMaterial({
  color: 0x888888,
  size: 0.2,
  sizeAttenuation: true,
});

async function fetchJSONData(inputJson) {
  const response = await fetch(inputJson);
  const resJson = await response.json();

  return resJson;
}
const canvas = document.querySelector("#c");
const gl = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
gl.shadowMap.enabled = true;
gl.shadowMap.type = THREE.PCFSoftShadowMap;

let geometryArray = [];
let meshArray = [];

let ambientLight;
let directionalLight;

//Function that builds the Objects zo Display
async function visData() {
  let lineArray = [];
  materialLine = new THREE.LineBasicMaterial({
    linewidth: 0.1,
    color: "black",
  });

  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  // create camera
  const angleOfView = 55;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const nearPlane = 1;
  const farPlane = 400;
  const camera = new THREE.PerspectiveCamera(
    angleOfView,
    aspectRatio,
    nearPlane,
    farPlane,
  );
  camera.position.set(0, 200, 120);

  // create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color("white");
  console.log(lorMap.keys());
  console.log(fwData);
  console.log(berlinGeo);
  console.log(berlinGeo.features[0].geometry.coordinates);

  let centerLat = 52.51772;
  let centerLon = 13.399207;
  const extrudeSettings = {
    steps: 2,
    depth: 2,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 1,
    bevelSegments: 1,
  };

  let pointsArray = [];
  let spherePointArray = [];
  const centerInMercator = gpsToCart(centerLat, centerLon);
  berlinGeo.features.forEach((element) => {
    const geoPointsVec3 = [];
    const geoPointsArray = [];

    let lor = element.properties.PLR_ID;
    element.geometry.coordinates[0][0].forEach((elementNest) => {
      let lat = elementNest[1];
      let lon = elementNest[0];
      let berlinGeoInMercator = gpsToCart(lat, lon);
      let geoMinusCenter = {
        x: berlinGeoInMercator.x - centerInMercator.x,
        y: berlinGeoInMercator.y - centerInMercator.y,
      };
      let vec3 = new THREE.Vector3(geoMinusCenter.x, geoMinusCenter.y, 0);
      geoPointsVec3.push(vec3);

      geoPointsArray.push(geoMinusCenter);
    });
    let height = getDataFromLorMap(lor);

    let depth;
    depth = height / maxValueToDivideBy;

    extrudeSettings.depth = depth * controls.scale;
    let tempMaterial = exMaterial;
    if (!(exMaterial instanceof THREE.MeshNormalMaterial)) {
      let color = colorPicker(depth);
      tempMaterial = exMaterial.clone();
      tempMaterial.color.set(color);
      exMaterial.color.set(color);
    }

    // let heightData = lorMap.get(lor);
    const geoGeometry = new THREE.BufferGeometry().setFromPoints(geoPointsVec3);
    geometryArray.push(geoGeometry);

    const outline = new THREE.Line(geoGeometry, materialLine);
    meshArray.push(outline);
    outline.rotation.x = -(Math.PI / 2);
    outline.castShadow = true;
    // outline.scale.set(new THREE.Vector3(0.002, 0.002, 0.002));

    scene.add(outline);
    if (barGraph) {
      let polyShape = new THREE.Shape(
        geoPointsArray.map((points) => new THREE.Vector2(points.x, points.y)),
      );
      const geometry = new THREE.ExtrudeGeometry(polyShape, extrudeSettings);
      geometryArray.push(geometry);
      const mesh = new THREE.Mesh(geometry, tempMaterial);
      meshArray.push(mesh);
      mesh.castShadow = true;
      mesh.rotation.x = -(Math.PI / 2);
      scene.add(mesh);
    } else if (lineGraph) {
      geoPointsArray.forEach((elem, index) => {
        if (index % 10 == 0) {
          let rand = Math.random() * (1.1 - 0.9) + 0.9;
          let vec3 = new THREE.Vector3(
            elem.x * rand,
            elem.y * rand,
            extrudeSettings.depth * rand,
          );
          pointsArray.push(vec3);
        }
      });
    } else if (sphereGraph) {
      outline.geometry.computeBoundingBox();
      let centerVec3 = new THREE.Vector3(0, 0, 0);
      outline.geometry.boundingBox.getCenter(centerVec3);
      let spGeo = new THREE.SphereGeometry(extrudeSettings.depth / 10, 32, 16);
      geometryArray.push(spGeo);
      let sphere = new THREE.Mesh(spGeo, tempMaterial);
      meshArray.push(sphere);
      sphere.position.set(centerVec3.x, centerVec3.z, -centerVec3.y);

      sphere.castShadow = true;
      scene.add(sphere);
    } else if (sphereGraphHeight) {
      outline.geometry.computeBoundingBox();
      let centerVec3 = new THREE.Vector3(0, 0, 0);
      outline.geometry.boundingBox.getCenter(centerVec3);
      let spGeo = new THREE.SphereGeometry(extrudeSettings.depth / 10, 32, 16);
      geometryArray.push(spGeo);
      let sphere = new THREE.Mesh(spGeo, tempMaterial);
      meshArray.push(sphere);
      sphere.position.set(centerVec3.x, extrudeSettings.depth, -centerVec3.y);

      sphere.castShadow = true;
      scene.add(sphere);
    } else if (sphereGraphWHeightLines) {
      outline.geometry.computeBoundingBox();
      let centerVec3 = new THREE.Vector3(0, 0, 0);
      outline.geometry.boundingBox.getCenter(centerVec3);
      let spGeo = new THREE.SphereGeometry(extrudeSettings.depth / 10, 32, 16);
      geometryArray.push(spGeo);
      let sphere = new THREE.Mesh(spGeo, tempMaterial);
      meshArray.push(sphere);
      sphere.position.set(centerVec3.x, extrudeSettings.depth, -centerVec3.y);
      sphere.castShadow = true;
      scene.add(sphere);

      lineArray.push(centerVec3);
      let tempVec = new THREE.Vector3(
        centerVec3.x,
        extrudeSettings.depth,
        -centerVec3.y,
      );
      lineArray.push(tempVec);
    } else if (sphereGraphLines) {
      outline.geometry.computeBoundingBox();
      let centerVec3 = new THREE.Vector3(0, 0, 0);
      outline.geometry.boundingBox.getCenter(centerVec3);
      let spGeo = new THREE.SphereGeometry(0.3, 32, 16);
      geometryArray.push(spGeo);
      let sphere = new THREE.Mesh(spGeo, tempMaterial);
      meshArray.push(sphere);
      sphere.position.set(centerVec3.x, extrudeSettings.depth, -centerVec3.y);

      sphere.castShadow = true;
      let spherePosition = new THREE.Vector3(0, 0, 0);
      spherePosition.x = centerVec3.x;
      spherePosition.y = extrudeSettings.depth;
      spherePosition.z = -centerVec3.y;
      spherePointArray.push(spherePosition);
    } else if (sphereGraphLines) {
      outline.geometry.computeBoundingBox();
      let centerVec3 = new THREE.Vector3(0, 0, 0);
      outline.geometry.boundingBox.getCenter(centerVec3);
      let spGeo = new THREE.SphereGeometry(0.3, 32, 16);
      geometryArray.push(spGeo);
      let sphere = new THREE.Mesh(spGeo, tempMaterial);
      meshArray.push(sphere);
      sphere.position.set(centerVec3.x, extrudeSettings.depth, -centerVec3.y);

      sphere.castShadow = true;
    }
  });
  if (lineGraph) {
    let pointGeometry = new THREE.BufferGeometry().setFromPoints(pointsArray);
    geometryArray.push(pointGeometry);
    const pointLine = new THREE.Line(pointGeometry, materialLine);
    pointLine.rotation.x = -(Math.PI / 2);
    scene.add(pointLine);
    let points = new THREE.Points(pointGeometry, pointsMaterial);
    meshArray.push(points);
    points.rotation.x = -(Math.PI / 2);
    scene.add(points);
  } else if (sphereGraphLines) {
    for (let i = 0; i < spherePointArray.length; i++) {
      for (let j = i + 1; j < spherePointArray.length; j++) {
        if (j % i == 0 && j % 4 == 0) {
          let twoPointsArray = [];
          twoPointsArray.push(spherePointArray[i]);
          twoPointsArray.push(spherePointArray[j]);
          let lineGeometry = new THREE.BufferGeometry().setFromPoints(
            twoPointsArray,
          );
          let line = new THREE.Line(lineGeometry, materialLine);
          scene.add(line);
        }
      }
    }
  } else if (sphereGraphWHeightLines) {
    for (let i = 0; i < lineArray.length - 2; i += 2) {

      let twoPointsArray = [];
      let elem1 = lineArray[i];
      let elem2 = lineArray[i + 1];
      twoPointsArray.push(elem1);
      twoPointsArray.push(elem2);
      let lineGeometry = new THREE.BufferGeometry().setFromPoints(
        twoPointsArray,
      );
      let line = new THREE.Line(lineGeometry, materialLine);
      scene.add(line);
    }
  }

  const geometry = new THREE.PlaneGeometry(250, 250);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(geometry, planeMaterial);
  plane.rotation.x = -(Math.PI / 2);
  plane.position.set(0, -25, 0);
  plane.receiveShadow = true;
  scene.add(plane);
  const ambientColor = 0xffffff;
  const ambientIntensity = 1;
  ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera = new THREE.OrthographicCamera(
    -100,
    100,
    100,
    -100,
    0.5,
    1000,
  );

  directionalLight.position.set(0, 30, 0);
  directionalLight.target = plane;
  scene.add(directionalLight.target);

  scene.add(directionalLight);

  const orbitControls = new OrbitControls(camera, gl.domElement);

  function draw() {
    if (resizeGLToDisplaySize(gl)) {
      const canvas = gl.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    orbitControls.update();
    stats.update();

    gl.render(scene, camera);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

// UPDATE RESIZE
function resizeGLToDisplaySize(gl) {
  const canvas = gl.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width != width || canvas.height != height;
  if (needResize) {
    gl.setSize(width, height, false);
  }
  return needResize;
}

async function main() {
  berlinGeo = await fetchJSONData(berlinJson);

  fwData = await fetchJSONData(berlinFwDataCurrentJson);
  lorMap = await convertJsonToMapWithLorKey(fwData);
  setMaxValueToDivideBy();
  visData();
}
main();

document.getElementById("reloadButton").addEventListener("click", () => {
  clearGeometries();
  main();
});
let materials = {
  material: "normal",
};

gui.add(controls, "scale", 1, 100);
gui
  .add(controls, "isTransparent")
  .listen()
  .onChange(function () {
    exMaterial.transparent = controls.isTransparent;
  });
gui
  .add(controls, "isWireframe")
  .listen()
  .onChange(function () {
    exMaterial.wireframe = controls.isWireframe;
  });
gui
  .add(controls, "opacity", 0.0, 1.0)
  .listen()
  .onChange(function () {
    exMaterial.opacity = controls.opacity;
  });
let folderMaterial = gui.addFolder("Material");
folderMaterial
  .add(materials, "material", {
    Normal: "normal",
    Phong: "phong",
    Physical: "physical",
    Standard: "standard",
    Toon: "toon",
  })
  .onChange(function () {
    changeMaterial();
  });

function changeMaterial() {
  switch (materials.material) {
    case "normal":
      exMaterial = new THREE.MeshNormalMaterial({
        transparent: controls.isTransparent,
        opacity: controls.opacity,
        wireframe: controls.isWireframe,
      });
      break;

    case "phong":
      exMaterial = new THREE.MeshPhongMaterial({
        transparent: controls.isTransparent,
        opacity: controls.opacity,
        color: "lightblue",
      });
      break;
    case "toon":
      exMaterial = new THREE.MeshToonMaterial({ color: "lightblue" });
      break;
    case "physical":
      exMaterial = new THREE.MeshPhysicalMaterial({
        clearcoat: 1.0,
        clearcoatRoughness: 1.0,
        metalness: 1.0,
        roughness: 0.5,
      });
      break;
    case "standard":
      exMaterial = new THREE.MeshStandardMaterial({});
      break;
    default:
      break;
  }
}

let dataSubset = {
  subset: "allMissions",
};
let dataSubsetFolder = gui.addFolder("Data Subset");
dataSubsetFolder
  .add(dataSubset, "subset", {
    Alle_Einsätze: "allMissions",
    RTW_Einsätze: "countEms",
    RTW_Kritische_Einsätze: "countEmsCritical",
    RTW_Reanimation: "countEmsCpr",
    Feuer: "fire",
    Technische_Rettung: "technical",
  })
  .onChange(function () {
    changeSubData();
  });

function changeSubData() {
  switch (dataSubset.subset) {
    case "allMissions":
      dataSubsetToDisplay = "mission_count_all";
      whichMaxValue = "mission_count_all_max";
      break;
    case "countEms":
      dataSubsetToDisplay = "mission_count_ems";
      whichMaxValue = "mission_count_ems_max";
      break;
    case "countEmsCritical":
      dataSubsetToDisplay = "mission_count_ems_critical";
      whichMaxValue = "mission_count_ems_critical_max";
      break;
    case "countEmsCpr":
      dataSubsetToDisplay = "mission_count_ems_critical_cpr";
      whichMaxValue = "mission_count_ems_critical_cpr_max";
      break;
    case "fire":
      dataSubsetToDisplay = "mission_count_fire";
      whichMaxValue = "mission_count_fire_max";
      break;
    case "technical":
      dataSubsetToDisplay = "mission_count_technical_rescue";
      whichMaxValue = "mission_count_technical_rescue_max";
      break;
    default:
      break;
  }
}
function getDataFromLorMap(key) {
  switch (dataSubsetToDisplay) {
    case "mission_count_all":
      return lorMap.get(parseInt(key)).mission_count_all;
    case "mission_count_ems":
      return lorMap.get(parseInt(key)).mission_count_ems;
    case "mission_count_ems_critical":
      return lorMap.get(parseInt(key)).mission_count_ems_critical;
    case "mission_count_ems_critical_cpr":
      return lorMap.get(parseInt(key)).mission_count_ems_critical_cpr;
    case "mission_count_fire":
      return lorMap.get(parseInt(key)).mission_count_fire;
    case "mission_count_technical_rescue":
      return lorMap.get(parseInt(key)).mission_count_technical_rescue;
    default:
      break;
  }
}
function setMaxValueToDivideBy() {
  switch (whichMaxValue) {
    case "mission_count_all_max":
      maxValueToDivideBy = mission_count_all_max;
      break;
    case "mission_count_ems_max":
      maxValueToDivideBy = mission_count_ems_max;
      break;
    case "mission_count_ems_critical_max":
      maxValueToDivideBy = mission_count_ems_critical_max;
      break;
    case "mission_count_ems_critical_cpr_max":
      maxValueToDivideBy = mission_count_ems_critical_cpr_max;
      break;
    case "mission_count_fire_max":
      maxValueToDivideBy = mission_count_fire_max;
      break;
    case "mission_count_technical_rescue_max":
      maxValueToDivideBy = mission_count_technical_rescue_max;
      break;
    default:
      break;
  }
}
let dataYear = {
  year: "2024",
};
let dataYearFolder = gui.addFolder("Year");
dataYearFolder
  .add(dataYear, "year", {
    2024: "2024",
    2023: "2023",
    2022: "2022",
    2021: "2021",
    2020: "2020",
    2019: "2019",
    2018: "2018",
  })
  .onChange(function () {
    changeYearData();
  });

function changeYearData() {
  switch (dataYear.year) {
    case "2024":
      berlinFwDataCurrentJson = berlinFwData2024Json;
      break;
    case "2023":
      berlinFwDataCurrentJson = berlinFwData2023Json;
      break;
    case "2022":
      berlinFwDataCurrentJson = berlinFwData2022Json;
      break;
    case "2021":
      berlinFwDataCurrentJson = berlinFwData2021Json;
      break;
    case "2020":
      berlinFwDataCurrentJson = berlinFwData2020Json;
      break;
    case "2019":
      berlinFwDataCurrentJson = berlinFwData2019Json;
      break;
    case "2018":
      berlinFwDataCurrentJson = berlinFwData2018Json;
      break;
    default:
      break;
  }
}
let graphStyle = {
  style: "barGraph",
};
let graphStyleFolder = gui.addFolder("Graph Style");
graphStyleFolder
  .add(graphStyle, "style", {
    Bargraph: "barGraph",
    SphereGraph: "sphereGraph",
    SphereGraphHeight: "sphereGraphHeight",
    LineGraph: "lineGraph",
    sphereGraphLines: "sphereGraphLines",
    SphereWithLines: "sphereWithLines",
  })
  .onChange(function () {
    changeBarStyle();
  });

function changeBarStyle() {
  switch (graphStyle.style) {
    case "barGraph":
      barGraph = true;
      lineGraph = false;
      sphereGraph = false;
      sphereGraphHeight = false;
      sphereGraphLines = false;
      sphereGraphWHeightLines = false;
      break;
    case "sphereGraph":
      barGraph = false;
      lineGraph = false;
      sphereGraph = true;
      sphereGraphHeight = false;
      sphereGraphLines = false;
      sphereGraphWHeightLines = false;
      break;
    case "lineGraph":
      barGraph = false;
      lineGraph = true;
      sphereGraph = false;
      sphereGraphHeight = false;
      sphereGraphLines = false;
      sphereGraphWHeightLines = false;
      break;
    case "sphereGraphHeight":
      barGraph = false;
      lineGraph = false;
      sphereGraph = false;
      sphereGraphHeight = true;
      sphereGraphLines = false;
      sphereGraphWHeightLines = false;
      break;
    case "sphereGraphLines":
      barGraph = false;
      lineGraph = false;
      sphereGraph = false;
      sphereGraphHeight = false;
      sphereGraphLines = true;
      sphereGraphWHeightLines = false;
    case "sphereWithLines":
      barGraph = false;
      lineGraph = false;
      sphereGraph = false;
      sphereGraphHeight = false;
      sphereGraphLines = false;
      sphereGraphWHeightLines = true;
      break;
    default:
      break;
  }
}
// this trys to clear the meshes and geometries and dispose of them to make the performance better after reload
function clearGeometries() {
  scene.remove(ambientLight);
  scene.remove(directionalLight);
  meshArray.forEach((elem) => {
    scene.remove(elem);
  });
  meshArray = [];
  geometryArray.forEach((elem) => {
    elem.dispose();
  });
  geometryArray = [];
  materialLine.dispose();
}

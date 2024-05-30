import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const gui = new dat.GUI();
let stats = new Stats();

const berlinJson = "../assets/planung_conv.geojson";
const berlinFwDaten = "../assets/BFw_planning_room_data_2023.json";
let berlinGeo;
let fwData;
let lorMap;
let dataSubsetToDisplay = "mission_count_all";
let scene;

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
async function visData() {
  materialLine = new THREE.LineBasicMaterial({
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

    if (height) {
      let depth = (height / maxValueToDivideBy) * controls.scale;
      extrudeSettings.depth = depth;
    } else {
      extrudeSettings.height = 0.1;
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
    let polyShape = new THREE.Shape(
      geoPointsArray.map((points) => new THREE.Vector2(points.x, points.y)),
    );
    const geometry = new THREE.ExtrudeGeometry(polyShape, extrudeSettings);
    geometryArray.push(geometry);
    const mesh = new THREE.Mesh(geometry, exMaterial);
    meshArray.push(mesh);
    mesh.castShadow = true;
    mesh.rotation.x = -(Math.PI / 2);
    scene.add(mesh);
  });
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
  const ambientIntensity = 0.2;
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

  fwData = await fetchJSONData(berlinFwDaten);
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
      exMaterial = new THREE.MeshPhysicalMaterial({});
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

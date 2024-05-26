import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const berlinJson = "../assets/planung_conv.geojson";
const berlinFwDaten = "../assets/BFw_planning_room_data_2023.json";

async function fetchJSONData(inputJson) {
  const response = await fetch(inputJson);
  const resJson = await response.json();

  return resJson;
}
let mission_count_all_max = 0;
let mission_count_ems_max = 0;
let mission_count_ems_critical_max = 0;
let mission_count_ems_critical_cpr_max = 0;
let mission_count_fire_max = 0;
let mission_count_technical_rescue_max = 0;
async function convertJsonToMapWithLorKey(jsonData) {
  const lorKeyMap = new Map();
  jsonData.forEach((element) => {
    lorKeyMap.set(element.planning_room_id, {
      mission_count_all: element.mission_count_all,
      mission_count_ems: element.mission_count_ems,
      mission_count_ems_critical: element.mission_count_ems_critical,
      mission_count_ems_critical_cpr: element.mission_count_ems_critical_cpr,
      mission_count_fire: element.mission_count_fire,
      mission_count_technical_rescue: element.mission_count_technical_rescue

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
    if (element.mission_count_ems_critical_cpr > mission_count_ems_critical_cpr_max) {
      mission_count_ems_critical_cpr_max = element.mission_count_ems_critical_cpr;
    }
    if (element.mission_count_fire > mission_count_fire_max) {
      mission_count_fire_max = element.mission_count_fire;
    }
    if (element.mission_count_technical_rescue > mission_count_technical_rescue_max) {
      mission_count_technical_rescue_max = element.mission_count_technical_rescue;
    }
  });
  console.log(lorKeyMap);
  return lorKeyMap;
}
async function main() {
  const canvas = document.querySelector("#c");
  const gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  gl.shadowMap.enabled = true;
  const gui = new dat.GUI();
  let stats = new Stats();

  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  // create camera
  const angleOfView = 55;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const nearPlane = 1;
  const farPlane = 900;
  const camera = new THREE.PerspectiveCamera(
    angleOfView,
    aspectRatio,
    nearPlane,
    farPlane,
  );
  camera.position.set(0, 200, 120);
  

  // create the scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");

  const berlinGeo = await fetchJSONData(berlinJson);

  const fwData = await fetchJSONData(berlinFwDaten);
  let lorMap = await convertJsonToMapWithLorKey(fwData);
  console.log(lorMap.keys());
  console.log(fwData);
  console.log(berlinGeo);
  console.log(berlinGeo.features[0].geometry.coordinates);

  const material = new THREE.LineBasicMaterial({
    color: "black",
  });
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
  let centerLat = 52.51772;
  let centerLon = 13.399207;
  const extrudeSettings = {
    steps: 2,
    depth: 2,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 1,
  };

  const exmaterial = new THREE.MeshNormalMaterial({transparent: true, opacity: 0.8});

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

    let height = lorMap.get(parseInt(lor)).mission_count_ems_critical_cpr;

    if (height) {
      let depth = (height / mission_count_ems_critical_cpr_max) * 100;
      extrudeSettings.depth = depth;
    } else {
      extrudeSettings.height = 0.1;
    }
    // let heightData = lorMap.get(lor);
    const geoGeometry = new THREE.BufferGeometry().setFromPoints(geoPointsVec3);

    const outline = new THREE.Line(geoGeometry, material);
    outline.rotation.x = - (Math.PI / 2);
    // outline.scale.set(new THREE.Vector3(0.002, 0.002, 0.002));

    scene.add(outline);
    let polyShape = new THREE.Shape(
      geoPointsArray.map((points) => new THREE.Vector2(points.x, points.y)),
    );
    const geometry = new THREE.ExtrudeGeometry(polyShape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, exmaterial);
    mesh.rotation.x = - (Math.PI / 2);
    scene.add(mesh);

    // const polyGeometry = new THREE.ShapeGeometry(polyShape);
    // let polygon = new THREE.Mesh(
    //   polyGeometry,
    //   new THREE.MeshBasicMaterial({
    //     color: "grey",
    //     side: THREE.DoubleSide,
    //   }),
    // );
    // // polygon.position.set(0,0, testHight());
    // scene.add(polygon);
  });

  const ambientColor = 0xffffff;
  const ambientIntensity = 0.2;
  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);
  const orbitControls = new OrbitControls(camera, gl.domElement);
  var clock = new THREE.Clock();

  var controls = new (function () {
    this.x = 1;
  })();

  gui.add(controls, "x", 0, 2);
  let scaleVector = new THREE.Vector3();
  function draw(time) {
    time *= 0.001;
    if (resizeGLToDisplaySize(gl)) {
      const canvas = gl.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    orbitControls.update();
    stats.update();

    scaleVector.x = controls.x;
    scaleVector.y = controls.x;
    scaleVector.z = controls.x;
    // outline.scale.set(controls.x, controls.x, controls.x);

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
main();

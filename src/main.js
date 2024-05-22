import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const berlinJson = "../assets/planung_conv.geojson";

async function fetchJSONData() {
  const response = await fetch(berlinJson);
  const resJson = await response.json();

  return resJson;
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
  const nearPlane = 0.1;
  const farPlane = 9000000;
  const camera = new THREE.PerspectiveCamera(
    angleOfView,
    aspectRatio,
    nearPlane,
    farPlane,
  );
  camera.position.set(0, 8, 30);

  // create the scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("white");

  const berlinGeo = await fetchJSONData();
  console.log(berlinGeo);
  console.log(berlinGeo.features[0].geometry.coordinates);

  const material = new THREE.LineBasicMaterial({
    color: "black",
  });
  const degreesToRads = (deg) => (deg * Math.PI) / 180.0;
  function gpsToCart(lat, lon) {
    const mercator = { x: 0, y: 0 };
    const earthRad = 6378.137;

    mercator.x = degreesToRads(lon) * earthRad;
    mercator.y =
      (earthRad / 2) *
      Math.log(
        (1.0 + Math.sin(degreesToRads(lat))) /
          (1.0 - Math.sin(degreesToRads(lat))),
      );
    return mercator;
  }
  let centerLat = 52.51772;
  let centerLon = 13.399207;
  let tempHeightTest = 1;
  function testHight() {
    if (tempHeightTest % 2 === 0) {
      tempHeightTest += 1;
      return 3;
    } else {
      tempHeightTest += 1;
      return 0;
    }
  }
  const extrudeSettings = {
    steps: 2,
    depth: 2,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 1,
  };
  const centerInMercator = gpsToCart(centerLat, centerLon);
  console.log;
  berlinGeo.features.forEach((element) => {
    const geoPointsVec3 = [];
    const geoPointsArray = [];

    element.geometry.coordinates[0][0].forEach((elementNest) => {
      // let x =
      //   r *
      //   Math.cos(degreesToRads(element[1]) * Math.cos(degreesToRads(element[0])));
      // let y =
      //   r *
      //   Math.cos(degreesToRads(element[1]) * Math.sin(degreesToRads(element[0])));
      // let z = r * Math.sin(degreesToRads(element[1]));
      // console.log(x, y, z);
      // console.log(element);
      // let vec3 = new THREE.Vector3(x, y, z);
      // console.log(vec3);
      // geoPoints.push(vec3);

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

    const geoGeometry = new THREE.BufferGeometry().setFromPoints(geoPointsVec3);

    const outline = new THREE.Line(geoGeometry, material);
    // outline.scale.set(new THREE.Vector3(0.002, 0.002, 0.002));
    outline.position.set(0, 0, 3);

    scene.add(outline);
    let polyShape = new THREE.Shape(
      geoPointsArray.map((points) => new THREE.Vector2(points.x, points.y)),
    );
    const geometry = new THREE.ExtrudeGeometry(polyShape, extrudeSettings);
    const exmaterial = new THREE.MeshBasicMaterial({ color: "grey" });
    const mesh = new THREE.Mesh(geometry, exmaterial);
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

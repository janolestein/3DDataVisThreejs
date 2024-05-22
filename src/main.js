import * as THREE from "three";
import * as dat from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GeoJsonGeometry } from 'three-geojson-geometry';

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
  const nearPlane = 0.000000000000000000001;
  const farPlane = 9000;
  const camera = new THREE.PerspectiveCamera(
    angleOfView,
    aspectRatio,
    nearPlane,
    farPlane,
  );
  camera.position.set(0, 8, 30);

  // create the scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.3, 0.5, 0.8);

  const berlinGeo = await fetchJSONData();
  console.log(berlinGeo);
  console.log(berlinGeo.features[0].geometry.coordinates);

  const material = new THREE.LineBasicMaterial({
    color: 0x0000ff,
  });
  const degreesToRads = deg => (deg * Math.PI) / 180.0;
  let r = 1;
  const geoPoints = [];
  berlinGeo.features[0].geometry.coordinates[0][0].forEach((element) => {
    let x =
      r *
      Math.cos(degreesToRads(element[1]) * Math.cos(degreesToRads(element[0])));
    let y =
      r *
      Math.cos(degreesToRads(element[1]) * Math.sin(degreesToRads(element[0])));
    let z = r * Math.sin(degreesToRads(element[1]));
    console.log(x, y, z);
    console.log(element);
    let vec3 = new THREE.Vector3(x, y, z);
    console.log(vec3);
    geoPoints.push(vec3);
  });

  const geoGeometry = new THREE.BufferGeometry().setFromPoints(geoPoints);
  console.log(geoPoints);

  const outline = new THREE.Line(geoGeometry, material);
  outline.scale.set(new THREE.Vector3(0.002, 0.002, 0.002));
  outline.position.set(0, 0, 0);

  scene.add(outline);
  const points = [];
  points.push(new THREE.Vector3(geoPoints[0].x, geoPoints[0].y, geoPoints[0].z));
  points.push(new THREE.Vector3(geoPoints[1].x, geoPoints[1].y, geoPoints[1].z));
  points.push(new THREE.Vector3(1, 1, 1));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  const myLine = new THREE.Line(
  new GeoJsonGeometry(berlinJson),
  new THREE.LineBasicMaterial({ color: 'blue' })
);
  scene.add(myLine);
  const ambientColor = 0xffffff;
  const ambientIntensity = 0.2;
  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);
  const orbitControls = new OrbitControls(camera, gl.domElement);
  var clock = new THREE.Clock();

  var controls = new (function () {
    this.x = 0.1;
  })();

  gui.add(controls, "x", 0, 10000);
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
    outline.scale.set(controls.x, controls.x, controls.x);

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

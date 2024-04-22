import * as dat from 'dat.gui';
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

main();

function main() {
  // create context
  const canvas = document.querySelector("#c");
  const gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  // create camera
  const angleOfView = 55;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const nearPlane = 0.1;
  const farPlane = 100;
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


  // GEOMETRY
  // create the cube
  const cubeSize = 4;
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  // Create the Sphere
  const sphereRadius = 3;
  const sphereWidthSegments = 32;
  const sphereHeightSegments = 16;
  const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius,
    sphereWidthSegments,
    sphereHeightSegments,
  );




  // MATERIALS

  const cubeMaterial = new THREE.MeshPhongMaterial({
    color: "pink",
  });

  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: "tan",
  });



  // MESHES
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(cubeSize + 1, cubeSize + 1, 0);
  scene.add(cube);
  console.log(cube);

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
  scene.add(sphere);



  //LIGHTS
  const color = 0xffffff;
  const intensity = 0.7;
  const light = new THREE.DirectionalLight(color, intensity);
  light.target = cube;
  light.position.set(0, 30, 30);
  scene.add(light);
  scene.add(light.target);

  const ambientColor = 0xffffff;
  const ambientIntensity = 0.2;
  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);



  var controls = new (function () {
    this.rotationSpeed = 0.02;
  })();

  var gui = new dat.GUI();
  gui.add(controls, "rotationSpeed", 0, 0.5);

  var trackballControls = new TrackballControls(camera, gl.domElement);
  var clock = new THREE.Clock();
  // DRAW
  function draw(time) {
    time *= 0.001;

    if (resizeGLToDisplaySize(gl)) {
      const canvas = gl.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    trackballControls.update(clock.getDelta());

    // rotate the cube around its axes
    cube.rotation.x += controls.rotationSpeed;
    cube.rotation.y += controls.rotationSpeed;
    cube.rotation.z += controls.rotationSpeed;

    sphere.rotation.x += controls.rotationSpeed;
    sphere.rotation.y += controls.rotationSpeed;
    sphere.rotation.y += controls.rotationSpeed;

    light.position.x = 20 * Math.cos(time);
    light.position.y = 20 * Math.sin(time);
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


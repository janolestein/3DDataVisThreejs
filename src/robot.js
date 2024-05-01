import { MTLLoader } from "three/examples/jsm/loaders/MTLLoadeh";
main();

function main() {
  // create context
  const canvas = document.querySelector("#c");
  const gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  gl.shadowMap.enabled = true;
  var stats = initStats();
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
  const fog = new THREE.Fog("grey", 1, 90);
  scene.fog = fog;

  // create the cube
  const cubeSize = 4;
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  const cubeMaterial = new THREE.MeshPhongMaterial({
    color: "pink",
  });

  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0, cubeSize + 1, -11);
  cube.castShadow = true;
  scene.add(cube);
  console.log(cube);

  const textureLoader = new THREE.TextureLoader();
  // Create the Sphere
  const sphereRadius = 3;
  const sphereWidthSegments = 32;
  const sphereHeightSegments = 16;
  const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius,
    sphereWidthSegments,
    sphereHeightSegments,
  );
  const sphereNormalMap = textureLoader.load("textures/sphere_normal.png");
  sphereNormalMap.wrapS = THREE.RepeatWrapping;
  sphereNormalMap.wrapT = THREE.RepeatWrapping;

  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: "tan",
    normalMap: sphereNormalMap,
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.position.set(-7, sphereRadius + 2, 3);
  scene.add(sphere);

  //Load textures

  // Create the upright plane
  const planeWidth = 256;
  const planeHeight = 128;
  const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  var texture = textureLoader.load("assets/stone.jpg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  //Create Plane
  const planeTextureMap = textureLoader.load("textures/pebbles.jpg");
  planeTextureMap.wrapS = THREE.RepeatWrapping;
  planeTextureMap.wrapT = THREE.RepeatWrapping;
  planeTextureMap.repeat.set(16, 16);
  //planeTextureMap.magFilter = THREE.NearestFilter;
  planeTextureMap.minFilter = THREE.NearestFilter;
  planeTextureMap.anisotropy = gl.getMaxAnisotropy();
  const planeNorm = textureLoader.load("textures/pebbles_normal.png");
  planeNorm.wrapS = THREE.RepeatWrapping;
  planeNorm.wrapT = THREE.RepeatWrapping;
  planeNorm.minFilter = THREE.NearestFilter;
  planeNorm.repeat.set(16, 16);
  const planeMaterial = new THREE.MeshStandardMaterial({
    map: planeTextureMap,
    side: THREE.DoubleSide,
    normalMap: planeNorm,
  });

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = Math.PI / 2;
  scene.add(plane);
  var loader = new THREE.OBJLoader();
  // const mtlLoader = new MTLLoader();
  // mtlLoader.load("assets/teapot.mtl", (materials) => {
  //   materials.preload();
  //   console.log(materials);
  //   loader.setMaterials(materials);
  //
  //   loader.load(
  //     "assets/teapot.obj",
  //     function (mesh) {
  //       var material = new THREE.MeshPhongMaterial({ map: texture });
  //
  //       mesh.traverse(function (child) {
  //         if (child.isMesh) {
  //           child.material = material;
  //           child.castShadow = true;
  //         }
  //       });
  //
  //       mesh.position.set(7, 4, 3);
  //
  //       scene.add(mesh);
  //       console.log(mesh);
  //     },
  //     function (xhr) {
  //       console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  //     },
  //     function (error) {
  //       console.log(error);
  //       console.log("An error happened");
  //     },
  //   );
  // });

  loader.load(
    "assets/teapot.obj",
    function (mesh) {
      var material = new THREE.MeshPhongMaterial({ map: texture });

      mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material = material;
          child.castShadow = true;
        }
      });

      mesh.position.set(7, 4, 3);

      scene.add(mesh);
      console.log(mesh);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log(error);
      console.log("An error happened");
    },
  );

  //start robot segment implimentation

  function addSeg(parent, height, posY) {
    const segGeometry = new THREE.BoxGeometry(1, height, 1);
    segGeometry.translate(0, height / 2, 0);
    const segMaterial = new THREE.MeshPhongMaterial({
      color: "grey",
    });

    const seg = new THREE.Mesh(segGeometry, segMaterial);
    seg.position.set(0, posY, 0);

    // const pivot = new THREE.Object3D();
    // pivot.translateY(height / 2);
    // seg.add(pivot);
    parent.add(seg);
    return seg;
  }

  let h1 = 1 + 2.5;
  let h2 = 0.8 + 2.5;
  let h3 = 0.6 + 2.5;

  let seg1 = addSeg(scene, h1, 4);
  let seg2 = addSeg(seg1, h2, h1);
  let seg3 = addSeg(seg2, h3, h2);

  const lightSphereGeometry = new THREE.SphereGeometry(1, 25, 25);
  const lightSphereMaterial = new THREE.MeshStandardMaterial({
    color: "yellow",
  });
  const lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
  lightSphere.position.set(0, h2, 0);
  const armLight = new THREE.PointLight(0xffffff, 1);
  armLight.castShadow = true;
  lightSphere.add(armLight);
  seg3.add(lightSphere);
  //LIGHTS
  const color = 0xffffff;
  const intensity = 0.7;
  const light = new THREE.DirectionalLight(color, intensity);
  light.target = plane;
  light.position.set(0, 30, 30);
  light.castShadow = true;
  scene.add(light);
  scene.add(light.target);

  const ambientColor = 0xffffff;
  const ambientIntensity = 0.2;
  const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
  scene.add(ambientLight);

  // call the render function
  var step = 0;

  var controls = new (function () {
    this.rotationSpeed = 0.02;
    this.rotY1 = 2.23;
    this.rotZ1 = Math.PI / 5;
    this.rotZ2 = Math.PI / 5;
    this.rotZ3 = Math.PI / 5;
  })();

  var gui = new dat.GUI();
  gui.add(controls, "rotationSpeed", 0, 0.5);
  gui.add(controls, "rotY1", 0, 2 * Math.PI);
  gui.add(controls, "rotZ1", 0, 2 * Math.PI);
  gui.add(controls, "rotZ2", 0, 2 * Math.PI);
  gui.add(controls, "rotZ3", 0, 2 * Math.PI);
  var zAxis = new THREE.Vector3(0, 0, 1);
  var yAxis = new THREE.Vector3(0, 1, 0);
  // attach them here, since appendChild needs to be called first
  var trackballControls = initTrackballControls(camera, gl);
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
    stats.update();

    // rotate the cube around its axes
    cube.rotation.x += controls.rotationSpeed;
    cube.rotation.y += controls.rotationSpeed;
    cube.rotation.z += controls.rotationSpeed;

    sphere.rotation.x += controls.rotationSpeed;
    sphere.rotation.y += controls.rotationSpeed;
    sphere.rotation.y += controls.rotationSpeed;

    seg1.rotation.y = controls.rotY1;
    seg1.rotation.z = controls.rotZ1;
    seg2.rotation.z = controls.rotZ2;
    seg3.setRotationFromAxisAngle(zAxis, controls.rotZ3);
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

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const title = document.getElementById("title");
title.innerText = "Zomblood";
const btnLock = document.getElementById("btnLock");
// LOADING TEXTURES
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load( 'wall.jpg' );
texture.colorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth/4, window.innerHeight/4);
renderer.domElement.style.width = "100vw";
renderer.domElement.style.height = "100vh";
renderer.domElement.style.imageRendering = "pixelated";
document.body.appendChild( renderer.domElement );

//LUZ AMBIENTAL
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); 
scene.add(ambientLight);

const controls = new PointerLockControls( camera, document.body );
btnLock.onclick = () => controls.lock();

//RAYCASTING
const raycaster = new THREE.Raycaster();
const centroPantalla = new THREE.Vector2(0, 0);

//LOADING 3D MODELS
const loader = new GLTFLoader();
loader.load('assets/map01.glb', function (gltf){
  gltf.scene.position.y = -2;
  gltf.scene.scale.set(0.05, 0.05, 0.05);
  scene.add(gltf.scene);
}, undefined, function(error){
  console.error(error);
});
//COLT
let colt;
let mixer; // El reproductor de animaciones
let actionFire; // La acción específica de disparar
const clock = new THREE.Clock();
loader.load('assets/colt_m1911.glb', function (gltf){
  gltf.scene.scale.set(0.05, 0.05, 0.05);
  colt = gltf.scene;
  mixer = new THREE.AnimationMixer(colt);
  const fireClip = THREE.AnimationClip.findByName(gltf.animations, "Fire");
  if (fireClip) {
    actionFire = mixer.clipAction(fireClip);
    // CONFIGURACIÓN CRÍTICA PARA UN ARMA:
    actionFire.setLoop(THREE.LoopOnce); // Que solo se reproduzca UNA vez por click
    actionFire.clampWhenFinished = true; // Que se quede quieta al terminar, no que regrese bruscamente al inicio
    actionFire.timeScale = 10;
  }
  const animaciones = gltf.animations;
  if (animaciones && animaciones.length > 0) {
    console.log(`¡Éxito! El modelo tiene ${animaciones.length} animaciones.`);
    animaciones.forEach((clip, index) => {
      console.log(`Animación [${index}]: Nombre = "${clip.name}", Duración = ${clip.duration}s`);
    });
  } else {
    console.log("Este modelo es estático. No contiene animaciones.");
  }
  camera.add(colt); 
  colt.position.set(0.7, -0.7, -1.4); 
  colt.rotation.set(0, -1.72, -0.15);
}, undefined, function(error){
  console.error(error);
});
scene.add(camera);

camera.position.z = 5;
camera.position.y = 2;

//ADDING LINES
const lineMat = new THREE.LineBasicMaterial( { color: 0xffffff } );
const points = [];
points.push( new THREE.Vector3( -5, 0, 0 ) );
points.push( new THREE.Vector3( 0, 5, 0 ) );
points.push( new THREE.Vector3( 5, 0, 0 ) );
const lineGeo = new THREE.BufferGeometry().setFromPoints( points );
const line = new THREE.Line( lineGeo, lineMat);
scene.add(line);

function addPlayer(x,y){
  const capGeo = new THREE.CapsuleGeometry(0.7, 2);
  const capMat = new THREE.MeshBasicMaterial({color: 0x0000ff});
  const player = new THREE.Mesh(capGeo, capMat);
  player.position.x = x;
  player.position.y = y;
  scene.add(player);
  return player;
}

function addBasicCube(x,y,colorortexture){
  const boxGeo = new THREE.BoxGeometry( 1, 1, 1 );
  let basicMat;
  if(typeof colorortexture == "number") basicMat = new THREE.MeshBasicMaterial( { color: colorortexture} );
  else basicMat = new THREE.MeshBasicMaterial( { map: colorortexture} );
  const basicCube = new THREE.Mesh( boxGeo, basicMat);
  basicCube.position.x = x;
  basicCube.position.y = y;
  scene.add( basicCube);
  return basicCube;
}

const cubo1 = addBasicCube(0,0, texture);
const cubo2 = addBasicCube(0,2, 0xFF0000);
const player1 = addPlayer(1,0);

let keys = {};
const target = new THREE.Vector3();

//MAIN LOOP
let speed = 0.1;
function animate( time ) {

  const delta = clock.getDelta(); 
  if (mixer) {
    mixer.update(delta);
  }

  cubo1.rotation.x = time / 500;
  cubo1.rotation.y = time / 500;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction); // Esto nos da la dirección en (x, y, z)
  direction.y = 0;
  target.set(
    player1.position.x + direction.x,
    player1.position.y, // Mantenemos la misma altura (Y)
    player1.position.z + direction.z
  );
  player1.lookAt(target);

  if(keys['shift']){
    speed = 0.2;
  }else{
    speed = 0.1;
  }
  if (keys['w']) {
    player1.position.addScaledVector(direction, speed);
  }
  if (keys['s']) {
    player1.position.addScaledVector(direction, -speed);
  }
  const right = new THREE.Vector3();
  right.crossVectors(direction, new THREE.Vector3(0, 1, 0)); // Vector a la derecha
  if (keys['d']) {
    player1.position.addScaledVector(right, speed);
  }
  if (keys['a']) {
    player1.position.addScaledVector(right, -speed);
  }

  camera.position.x = player1.position.x;
  camera.position.z = player1.position.z;

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

document.body.onkeydown = (e)=>{
  keys[e.key.toLowerCase()] = true;
}

document.body.onkeyup = (e)=>{
  keys[e.key.toLowerCase()] = false;
}
window.addEventListener('mousedown', () => {
  // Solo disparamos si el juego está activo (pantalla bloqueada) y la animación cargó
  if (controls.isLocked && actionFire) {
    actionFire.stop(); 
    actionFire.time = 3;
    actionFire.play();
    raycaster.setFromCamera(centroPantalla, camera);
    const colisiones = raycaster.intersectObjects(scene.children, true);

    // Si el rayo chocó con al menos un objeto...
    if (colisiones.length > 0) {
      const objetoGolpeado = colisiones[0].object;
      console.log("¡Impacto confirmado!", objetoGolpeado);

      if (objetoGolpeado === cubo2) {
        objetoGolpeado.position.x = getRandomInt(-1,10);
        objetoGolpeado.position.z = getRandomInt(-1,10);
        objetoGolpeado.position.y = getRandomInt(0,5);
      }
    }
  }
});
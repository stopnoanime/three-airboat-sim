import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as PLANCK from 'planck';
import { Airboat } from './Airboat';
import { KeyboardController } from './KeyboardController';
import { GUI } from 'dat.gui'
import { environment } from 'src/environments/environment';
import { Scenery } from './Scenery';
import noise_3d from './noise_3d';
import { Water } from './Water';
import { Howl } from 'howler';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable({
  providedIn: 'root'
})
export class SimService {

  public loaded = false;
  public playing = false;
  public loadingProgress = 0;

  public airboat: Airboat;
  public keyboardController: KeyboardController;
  
  public backgroundColor = 0xbae6fd;

  private water!: Water;
  private scenery!: Scenery;
  private renderer!: THREE.WebGLRenderer;

  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private world: PLANCK.World;
  private sound: Howl;

  constructor() {
    (THREE.ShaderChunk as any).noise_3d = noise_3d;

    this.camera = new THREE.PerspectiveCamera(75);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);
    this.clock = new THREE.Clock();

    this.world = new PLANCK.World({
      gravity: new PLANCK.Vec2(0,0),
    });

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.left = -0.3
    this.dirLight.shadow.camera.right = 0.3
    this.dirLight.shadow.camera.top = 0.3
    this.dirLight.shadow.camera.bottom = -0.3
    this.dirLight.shadow.camera.far = 1.5;
    this.scene.add(this.dirLight);

    this.airboat = new Airboat(this.world);
    this.dirLight.target = this.airboat;
    this.scene.add(this.airboat);

    this.keyboardController = new KeyboardController();

    this.sound = new Howl({
      src: ['assets/bg.mp3'],
      loop: true,
      volume: 0.5
    });

    THREE.DefaultLoadingManager.onProgress = (_, l, t) => this.loadingProgress = l/t;
  }

  public async initialize(canvas: HTMLCanvasElement) {
    if(this.loaded) return;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas
    })
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const meshLoader = new GLTFLoader();
    const loader = new THREE.FileLoader();
    const textureLoader = new THREE.TextureLoader();

    const waterHeightMap = textureLoader.loadAsync(environment.waterHeightMapUrl);
    const terrainHeightMap = textureLoader.loadAsync(environment.terrainHeightMapUrl);
    const mapSvg = loader.setResponseType('document').setMimeType("text/html" as any).loadAsync(environment.mapSvgUrl) as any;
    const meshPromises = environment.meshes.map(m => meshLoader.loadAsync(`assets/${m}.glb`).then(g => [m, g] as [string, GLTF]));

    this.scenery = new Scenery(this.world, await mapSvg, await terrainHeightMap);
    this.scenery.placeMeshes(await mapSvg, await terrainHeightMap, new Map(await Promise.all(meshPromises)));
    this.scene.add(this.scenery);

    this.water = new Water(await waterHeightMap);
    this.scene.add(this.water);


    if(environment.DEBUG) this.initDebugGui();

    this.loaded = true;

    this.onResize();
    this.gameLoop();
  }

  public start() {
    if(!this.loaded || this.playing) return;

    this.sound.play();
    this.airboat.sound.play();

    this.playing = true;

    this.gameLoop();
  }

  public stop() {
    if(!this.loaded || !this.playing) return;

    this.sound.stop();
    this.airboat.sound.stop();

    this.playing = false;
  }

  public onResize() {
    if(!this.loaded) return;

    const rect = this.renderer.domElement.getBoundingClientRect();

    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();

    this.renderer.render( this.scene, this.camera );
  }

  public reset() {
    this.airboat.reset();
  }

  private gameLoop() {
    this.airboat.calculateForces(this.keyboardController.stepAxisValues());

    this.world.step(1/144);

    this.airboat.syncBodyAndMesh();
    this.airboat.updateTime(this.clock.getElapsedTime());
    this.airboat.updateCamera(this.camera, this.keyboardController.getCameraDirection());

    this.dirLight.position.copy(this.airboat.position.clone().add(new THREE.Vector3(0,0.6,0.6)));
    this.water.updateTime(this.clock.getElapsedTime());
    
    this.renderer.render( this.scene, this.camera );

    if(this.playing) requestAnimationFrame(() => this.gameLoop());
  }

  private initDebugGui() {
    const gui = new GUI();

    const airboatFolder = gui.addFolder('Airboat')

    airboatFolder.add(this.airboat.settings, 'velocityTurningTorque', 0, 0.2, 0.001)
    airboatFolder.add(this.airboat.settings, 'thrustTurningTorque', 0, 2)
    airboatFolder.add(this.airboat.settings, 'turningFriction', 0, 2)
    airboatFolder.add(this.airboat.settings, 'sidewaysDrag', 0, 5)
    airboatFolder.add(this.airboat.settings, 'frontalDrag', 0, 2)
    airboatFolder.add(this.airboat.settings, 'thrust', 1, 10)
    airboatFolder.add(this.airboat.settings, 'baseCameraDistance', 0.1, 10)
    airboatFolder.add(this.airboat.settings, 'cameraDistanceVelocityScale', 0, 1)
    airboatFolder.add(this.airboat.settings, 'yPosition', 0, 0.2)
    airboatFolder.add(this.airboat.settings, 'swayMaxX', 0, 0.2)
    airboatFolder.add(this.airboat.settings, 'swayMultiplierX', 0, 0.02)
    airboatFolder.add(this.airboat.settings, 'swayMaxZ', 0, 0.2)
    airboatFolder.add(this.airboat.settings, 'swayMultiplierZ', 0, 0.02)

    airboatFolder.addColor(this.airboat.settings, 'mainColor' )
    .onChange((v) => this.airboat.mainMaterial.color.set(v));
    airboatFolder.addColor(this.airboat.settings, 'accentColor' )
    .onChange((v) => this.airboat.accentMaterial.color.set(v));
    airboatFolder.addColor(this.airboat.settings, 'lineColor' )
    .onChange((v) => this.airboat.lineMaterial.color.set(v));
    airboatFolder.addColor(this.airboat.settings, 'foamColor' )
    .onChange((v) => this.airboat.foamMaterial.uniforms['color'].value.set(v));

    const sceneryFolder = gui.addFolder('Scenery');
    sceneryFolder.addColor(this.scenery, 'sandColor')
    .onChange((v) => this.scenery.material.uniforms['sandColor'].value.set(v));
    sceneryFolder.addColor(this.scenery, 'grassColor')
    .onChange((v) => this.scenery.material.uniforms['grassColor'].value.set(v));
    sceneryFolder.addColor(this, 'backgroundColor')
    .onChange((v) => (this.scene.background as THREE.Color).set(v));

    const waterFolder = gui.addFolder('Water');
    waterFolder.addColor(this.water, 'waterColorDeep')
    .onChange((v) => this.water.material.uniforms['waterColorDeep'].value.set(v));
    waterFolder.addColor(this.water, 'waterColorShallow')
    .onChange((v) => this.water.material.uniforms['waterColorShallow'].value.set(v));
    waterFolder.add(this.water, 'surfaceNoiseCutoff', 0, 0.2)
    .onChange((v) => this.water.material.uniforms['surfaceNoiseCutoff'].value = v);
    waterFolder.add(this.water, 'edgeFoamCutoffMin', 0, 1)
    .onChange((v) => this.water.material.uniforms['edgeFoamCutoffMin'].value = v);
    waterFolder.add(this.water, 'edgeFoamCutoffMax', 0, 1)
    .onChange((v) => this.water.material.uniforms['edgeFoamCutoffMax'].value = v);
    waterFolder.add(this.water, 'noiseSpeed', 0, 0.2)
    .onChange((v) => this.water.material.uniforms['noiseSpeed'].value = v);
    waterFolder.add(this.water, 'noiseSize', 1, 200)
    .onChange((v) => this.water.material.uniforms['noiseSize'].value = v);

    this.scene.add(new THREE.CameraHelper(this.dirLight.shadow.camera));
  }
}

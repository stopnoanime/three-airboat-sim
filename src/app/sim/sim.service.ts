import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as PLANCK from 'planck';
import { Airboat } from './Airboat';
import { InputController } from './InputController';
import { GUI } from 'dat.gui';
import { environment } from 'src/environments/environment';
import { Scenery } from './Scenery';
import noise_3d from './noise_3d';
import { Water } from './Water';
import { Howl } from 'howler';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';

/**
 * The main game/sim service.
 */
@Injectable({
  providedIn: 'root',
})
export class SimService {
  public loaded = false;
  public playing = false;
  /** Progress goes from 0 to 1 */
  public loadingProgress = 0;

  public airboat: Airboat;
  public inputController: InputController;

  /** The sky's color */
  public backgroundColor = 0xbae6fd;

  private water!: Water;
  private scenery!: Scenery;
  private renderer!: THREE.WebGLRenderer;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private world: PLANCK.World;
  private sound: Howl;

  private stats?: Stats;

  constructor() {
    (THREE.ShaderChunk as any).noise_3d = noise_3d;

    this.camera = new THREE.PerspectiveCamera(75);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);

    this.world = new PLANCK.World();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.left = -0.3;
    this.dirLight.shadow.camera.right = 0.3;
    this.dirLight.shadow.camera.top = 0.3;
    this.dirLight.shadow.camera.bottom = -0.3;
    this.dirLight.shadow.camera.far = 1.5;
    this.scene.add(this.dirLight);

    this.airboat = new Airboat(this.world);
    this.dirLight.target = this.airboat;
    this.scene.add(this.airboat);

    this.inputController = new InputController();

    this.sound = new Howl({
      src: ['assets/bg.mp3'],
      loop: true,
    });

    THREE.DefaultLoadingManager.onProgress = (_, l, t) =>
      (this.loadingProgress = l / t);
  }

  /**
   * Setups renderer, loads assets, renders first frame
   * @param canvas The canvas to render to
   */
  public async initialize(canvas: HTMLCanvasElement) {
    if (this.loaded) return;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const meshLoader = new GLTFLoader();
    const loader = new THREE.FileLoader();
    const textureLoader = new THREE.TextureLoader();

    const heightMap = textureLoader.loadAsync(environment.heightMapUrl);
    const mapSvg = loader
      .setResponseType('document')
      .setMimeType('text/html' as any)
      .loadAsync(environment.mapSvgUrl) as any;
    const meshPromises = environment.meshes.map((m) =>
      meshLoader
        .loadAsync(`assets/${m}.glb`)
        .then((g) => [m, g] as [string, GLTF]),
    );

    this.scenery = new Scenery(this.world, await mapSvg, await heightMap);
    this.scenery.placeMeshes(
      await mapSvg,
      await heightMap,
      new Map(await Promise.all(meshPromises)),
    );
    this.scene.add(this.scenery);

    this.water = new Water(await heightMap);
    this.scene.add(this.water);

    if (environment.DEBUG) this.initDebugGui();

    this.loaded = true;

    this.onResize();
    this.startGameLoop();
  }

  /** Starts the game and music, `initialize()` must be called first */
  public start() {
    if (!this.loaded || this.playing) return;

    this.playing = true;

    this.startMusic();
    this.startGameLoop();
  }

  /** Stops the game and music */
  public stop() {
    if (!this.loaded || !this.playing) return;

    this.playing = false;

    this.stopMusic();
  }

  /** Starts music, can be called only if game is currently playing */
  public startMusic() {
    if (!this.playing) return;

    if (!this.sound.playing()) this.sound.play();
    if (!this.airboat.sound.playing()) this.airboat.sound.play();
  }

  /** Stops music */
  public stopMusic() {
    this.sound.stop();
    this.airboat.sound.stop();
  }

  /** On resize event handler */
  public onResize() {
    if (!this.loaded) return;

    const rect = this.renderer.domElement.getBoundingClientRect();

    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  /** Resets airboat position and throttle */
  public reset() {
    this.airboat.reset();
    this.inputController.axisValues.throttle = 0;
  }

  private startGameLoop() {
    const t = performance.now() / 1000;
    this.gameLoop(t, t);
  }

  private gameLoop(currentTime: number, previousTime: number) {
    let frameTime = Math.min(currentTime - previousTime, 1 / 20);

    const axisValues = this.inputController.stepAxisValues(frameTime);

    this.airboat.calculateForces(axisValues);
    this.world.step(frameTime);

    this.airboat.syncBodyAndMesh();
    this.airboat.updateSound(axisValues);
    this.airboat.updateControlSurfaces(axisValues);
    this.airboat.updateTime(currentTime);
    this.airboat.updateCamera(
      this.camera,
      this.inputController.getCameraDirection(),
    );

    this.dirLight.position.copy(
      this.airboat.position.clone().add(new THREE.Vector3(0, 0.6, 0.6)),
    );
    this.water.updateTime(currentTime);

    this.renderer.render(this.scene, this.camera);
    this.stats?.update();

    if (this.playing)
      requestAnimationFrame((t) => this.gameLoop(t / 1000, currentTime));
  }

  private initDebugGui() {
    const gui = new GUI();

    const airboatFolder = gui.addFolder('Airboat');

    airboatFolder.add(
      this.airboat.settings,
      'velocityTurningTorque',
      0,
      0.2,
      0.001,
    );
    airboatFolder.add(this.airboat.settings, 'thrustTurningTorque', 0, 2);
    airboatFolder.add(this.airboat.settings, 'turningFriction', 0, 2);
    airboatFolder.add(this.airboat.settings, 'sidewaysDrag', 0, 5);
    airboatFolder.add(this.airboat.settings, 'frontalDrag', 0, 2);
    airboatFolder.add(this.airboat.settings, 'thrust', 1, 10);
    airboatFolder.add(this.airboat.settings, 'baseCameraDistance', 0.1, 10);
    airboatFolder.add(
      this.airboat.settings,
      'cameraDistanceVelocityScale',
      0,
      1,
    );
    airboatFolder.add(this.airboat.settings, 'yPosition', 0, 0.2);
    airboatFolder.add(this.airboat.settings, 'swayMaxX', 0, 0.2);
    airboatFolder.add(this.airboat.settings, 'swayMultiplierX', 0, 0.02);
    airboatFolder.add(this.airboat.settings, 'swayMaxZ', 0, 0.2);
    airboatFolder.add(this.airboat.settings, 'swayMultiplierZ', 0, 0.02);

    airboatFolder
      .addColor(this.airboat.settings, 'mainColor')
      .onChange((v) => this.airboat.mainMaterial.color.set(v));
    airboatFolder
      .addColor(this.airboat.settings, 'accentColor')
      .onChange((v) => this.airboat.accentMaterial.color.set(v));
    airboatFolder
      .addColor(this.airboat.settings, 'lineColor')
      .onChange((v) => this.airboat.lineMaterial.color.set(v));
    airboatFolder
      .addColor(this.airboat.settings, 'foamColor')
      .onChange((v) =>
        this.airboat.foamMaterial.uniforms['color'].value.set(v),
      );

    const sceneryFolder = gui.addFolder('Scenery');
    sceneryFolder
      .add(this.scenery, 'heightMapOffset', 0, 1)
      .onChange(
        (v) => (this.scenery.material.uniforms['heightMapOffset'].value = v),
      );
    sceneryFolder
      .add(this.scenery, 'grassHeight', 0, 1)
      .onChange(
        (v) => (this.scenery.material.uniforms['grassHeight'].value = v),
      );
    sceneryFolder
      .addColor(this.scenery, 'sandColor')
      .onChange((v) =>
        this.scenery.material.uniforms['sandColor'].value.set(v),
      );
    sceneryFolder
      .addColor(this.scenery, 'grassColor')
      .onChange((v) =>
        this.scenery.material.uniforms['grassColor'].value.set(v),
      );
    sceneryFolder
      .addColor(this, 'backgroundColor')
      .onChange((v) => (this.scene.background as THREE.Color).set(v));

    const waterFolder = gui.addFolder('Water');
    waterFolder
      .addColor(this.water, 'waterColorDeep')
      .onChange((v) =>
        this.water.material.uniforms['waterColorDeep'].value.set(v),
      );
    waterFolder
      .addColor(this.water, 'waterColorShallow')
      .onChange((v) =>
        this.water.material.uniforms['waterColorShallow'].value.set(v),
      );
    waterFolder
      .add(this.water, 'waveNoiseCutoff', 0, 0.2)
      .onChange(
        (v) => (this.water.material.uniforms['waveNoiseCutoff'].value = v),
      );
    waterFolder
      .add(this.water, 'edgeFoamCutoffMin', 0, 1)
      .onChange(
        (v) => (this.water.material.uniforms['edgeFoamCutoffMin'].value = v),
      );
    waterFolder
      .add(this.water, 'edgeFoamCutoffMax', 0, 1)
      .onChange(
        (v) => (this.water.material.uniforms['edgeFoamCutoffMax'].value = v),
      );
    waterFolder
      .add(this.water, 'waveNoiseSpeed', 0, 0.2)
      .onChange(
        (v) => (this.water.material.uniforms['waveNoiseSpeed'].value = v),
      );
    waterFolder
      .add(this.water, 'waveNoiseSize', 0.001, 0.1)
      .onChange(
        (v) => (this.water.material.uniforms['waveNoiseSize'].value = v),
      );

    this.scene.add(new THREE.CameraHelper(this.dirLight.shadow.camera));

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }
}

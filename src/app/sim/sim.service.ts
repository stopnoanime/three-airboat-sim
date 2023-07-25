import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as PLANCK from 'planck';
import { Airboat } from './Airboat';
import { KeyboardController } from './KeyboardController';
import { GUI } from 'dat.gui'
import { environment } from 'src/environments/environment';
import { Scenery } from './Scenery';
import noise_3d from './noise_3d';

@Injectable({
  providedIn: 'root'
})
export class SimService {

  public sceneBackground = 0xdefffb;

  public airboat: Airboat;
  public keyboardController: KeyboardController;

  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private camera: THREE.PerspectiveCamera;
  private scenery: Scenery;
  private dirLight: THREE.DirectionalLight;
  private renderer!: THREE.WebGLRenderer;
  private world: PLANCK.World;

  constructor() {
    (THREE.ShaderChunk as any).noise_3d = noise_3d;
    
    this.camera = new THREE.PerspectiveCamera(75);

    this.scene = new THREE.Scene();
    
    this.clock = new THREE.Clock()

    this.world = new PLANCK.World({
      gravity: new PLANCK.Vec2(0,0),
    });

    this.scenery = new Scenery(this.world);
    this.scene.background = this.scenery.skyBox;
    this.scene.add(this.scenery);

    this.airboat = new Airboat(this.world);
    this.scene.add(this.airboat);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.target = this.airboat;
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.left = -0.5
    this.dirLight.shadow.camera.right = 0.5
    this.dirLight.shadow.camera.top = 0.5
    this.dirLight.shadow.camera.bottom = -0.5
    this.dirLight.shadow.camera.far = 2;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);

    this.keyboardController = new KeyboardController();

    if(environment.DEBUG) {
      const gui = new GUI();

      const airboatFolder = gui.addFolder('Airboat')

      airboatFolder.add(this.airboat.settings, 'velocityTurningTorque', 0, 0.2, 0.001)
      airboatFolder.add(this.airboat.settings, 'thrustTurningTorque', 0, 2)
      airboatFolder.add(this.airboat.settings, 'turningFriction', 0, 2)
      airboatFolder.add(this.airboat.settings, 'sidewaysDrag', 0, 5)
      airboatFolder.add(this.airboat.settings, 'frontalDrag', 0, 2)
      airboatFolder.add(this.airboat.settings, 'thrust', 1, 10)
      airboatFolder.add(this.airboat.settings, 'baseCameraDistance', 0.1, 100)
      airboatFolder.add(this.airboat.settings, 'cameraDistanceVelocityScale', 0.1, 1)
      airboatFolder.add(this.airboat.settings, 'yPosition', 0, 0.1)

      airboatFolder.addColor(this.airboat.settings, 'mainColor' )
      .onChange(() => this.airboat.mainMaterial.color.set(this.airboat.settings.mainColor));
      airboatFolder.addColor(this.airboat.settings, 'accentColor' )
      .onChange(() => this.airboat.accentMaterial.color.set(this.airboat.settings.accentColor));
      airboatFolder.addColor(this.airboat.settings, 'lineColor' )
      .onChange(() => this.airboat.lineMaterial.color.set(this.airboat.settings.lineColor));
      airboatFolder.open()

      const sceneryFolder = gui.addFolder('Scenery');
      sceneryFolder.addColor(this.scenery, 'sandColor')
      .onChange(() => this.scenery.terrainUniforms.sandColor.value.set(this.scenery.sandColor));
      sceneryFolder.addColor(this.scenery, 'grassColor')
      .onChange(() => this.scenery.terrainUniforms.grassColor.value.set(this.scenery.grassColor));

      const waterFolder = gui.addFolder('Water');
      waterFolder.addColor(this.scenery.water, 'waterColorDeep')
      .onChange(() => this.scenery.water.material.uniforms['waterColorDeep'].value.set(this.scenery.water.waterColorDeep));
      waterFolder.addColor(this.scenery.water, 'waterColorShallow')
      .onChange(() => this.scenery.water.material.uniforms['waterColorShallow'].value.set(this.scenery.water.waterColorShallow));
      waterFolder.add(this.scenery.water, 'surfaceNoiseCutoff', 0, 1)
      .onChange(() => this.scenery.water.material.uniforms['surfaceNoiseCutoff'].value = this.scenery.water.surfaceNoiseCutoff);
      waterFolder.add(this.scenery.water, 'edgeFoamCutoff', 0, 1)
      .onChange(() => this.scenery.water.material.uniforms['edgeFoamCutoff'].value = this.scenery.water.edgeFoamCutoff);
      waterFolder.add(this.scenery.water, 'distortionMapSpeed', 0, 0.1, 0.001)
      .onChange(() => this.scenery.water.material.uniforms['distortionMapSpeed'].value = this.scenery.water.distortionMapSpeed);
      waterFolder.add(this.scenery.water, 'distortionMapStrength', 0, 0.1, 0.001)
      .onChange(() => this.scenery.water.material.uniforms['distortionMapStrength'].value = this.scenery.water.distortionMapStrength);

      this.scene.add(new THREE.CameraHelper(this.dirLight.shadow.camera));
    }
  }

  public initialize(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas
    })
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.onResize();

    this.gameLoop();
  }

  public onResize() {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
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

    this.dirLight.position.copy(this.airboat.position.clone().add(new THREE.Vector3(0,1,1)));
    this.scenery.water.updateTime(this.clock.getElapsedTime());
    
    this.renderer.render( this.scene, this.camera );

    requestAnimationFrame(() => this.gameLoop());
  }
}

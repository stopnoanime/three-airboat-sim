import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Airboat } from './Airboat';
import { Water } from './Water';
import { KeyboardController } from './KeyboardController';
import { GUI } from 'dat.gui'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SimService {
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private water: Water;
  private clock: THREE.Clock;
  private renderer!: THREE.WebGLRenderer;

  public airboat: Airboat;
  public keyboardController: KeyboardController;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xD0F0FF );
    
    this.clock = new THREE.Clock();

    this.keyboardController = new KeyboardController();
    
    this.water = new Water(100,100);
    this.scene.add(this.water);
    
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));

    this.airboat = new Airboat();
    this.scene.add(this.airboat);

    if(environment.DEBUG) {
      const gui = new GUI()
      const airboatFolder = gui.addFolder('Airboat')
      airboatFolder.add(this.airboat.settings, 'velocityTurningTorque', 0, 0.2, 0.001)
      airboatFolder.add(this.airboat.settings, 'thrustTurningTorque', 0, 2)
      airboatFolder.add(this.airboat.settings, 'turningFriction', 0, 2)
      airboatFolder.add(this.airboat.settings, 'sidewaysDrag', 0, 5)
      airboatFolder.add(this.airboat.settings, 'frontalDrag', 0, 2)
      airboatFolder.add(this.airboat.settings, 'thrust', 1, 10)
      airboatFolder.add(this.airboat.settings, 'cameraDistance', 0.1, 10)
      airboatFolder.add(this.airboat.settings, 'yPosition', 0, 0.1)
      airboatFolder.addColor(this.airboat.settings, 'mainColor' )
      .onChange(() => this.airboat.mainMaterial.color.set(this.airboat.settings.mainColor));
      airboatFolder.addColor(this.airboat.settings, 'accentColor' )
      .onChange(() => this.airboat.accentMaterial.color.set(this.airboat.settings.accentColor));
      airboatFolder.addColor(this.airboat.settings, 'lineColor' )
      .onChange(() => this.airboat.lineMaterial.color.set(this.airboat.settings.lineColor));
      airboatFolder.open()
    }
  }

  public initialize(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas
    })

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
    this.airboat.integrate();
    this.airboat.updateCamera(this.camera, this.keyboardController.getCameraDirection());
    
    this.water.update(this.clock.getElapsedTime());

    this.renderer.render( this.scene, this.camera );

    requestAnimationFrame(() => this.gameLoop());
  }
}

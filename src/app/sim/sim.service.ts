import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Airboat } from './Airboat';
import { Water } from './Water';
import { KeyboardController } from './KeyboardController';
import { GUI } from 'dat.gui'

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

    this.airboat = new Airboat(true);
    this.scene.add(this.airboat);
    
    this.water = new Water(100,100);
    this.scene.add(this.water);
    
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.setScalar(1);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25), light);

    const gui = new GUI()
    const airboatFolder = gui.addFolder('Airboat')
    airboatFolder.add(this.airboat, 'velocityTurningTorqueMultiplier', 0, 0.2, 0.001)
    airboatFolder.add(this.airboat, 'thrustTurningTorqueMultiplier', 0, 2)
    airboatFolder.add(this.airboat, 'turningFrictionMultiplier', 0, 2)
    airboatFolder.add(this.airboat, 'sidewaysDragMultiplier', 0, 5)
    airboatFolder.add(this.airboat, 'frontalDragMultiplier', 0, 2)
    airboatFolder.add(this.airboat, 'thrustMultiplier', 1, 10)
    airboatFolder.open()
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
    this.airboat.removeFromParent();
    this.airboat = new Airboat();
    this.scene.add(this.airboat);
  }

  private gameLoop() {
    this.airboat.calculateForces(this.keyboardController.stepAxisValues());
    this.airboat.integrate();
    this.airboat.updateCamera(this.camera);

    this.water.update(this.clock.getElapsedTime());

    this.renderer.render( this.scene, this.camera );

    requestAnimationFrame(() => this.gameLoop());
  }
}

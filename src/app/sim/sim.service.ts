import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Airboat } from './Airboat';
import { Water } from './Water';
import { KeyboardController } from './KeyboardController';

@Injectable({
  providedIn: 'root'
})
export class SimService {
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private airboat: Airboat;
  private water: Water;
  private clock: THREE.Clock;
  private renderer!: THREE.WebGLRenderer;

  public keyboardController: KeyboardController;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75);

    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    this.keyboardController = new KeyboardController();

    this.airboat = new Airboat();
    this.scene.add(this.airboat);

    this.water = new Water(100,100);
    this.scene.add(this.water);
    
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.setScalar(1);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25), light);
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

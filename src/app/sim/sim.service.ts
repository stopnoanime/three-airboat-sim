import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class SimService {
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xD0F0FF );
    this.camera = new THREE.PerspectiveCamera(75);
  }

  public initialize(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas
    })

    this.scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({color: 0xffff00})));
    this.camera.position.set(5,5,5);
    this.camera.lookAt(new THREE.Vector3())
    this.onResize();

    this.gameLoop();
  }

  public onResize() {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  private gameLoop() {
    this.renderer.render( this.scene, this.camera );

    requestAnimationFrame(() => this.gameLoop());
  }
}

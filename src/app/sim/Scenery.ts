import * as THREE from 'three';
import { Water } from './Water';

export class Scenery extends THREE.Mesh {

    public override material: THREE.MeshLambertMaterial;
    public sandColor = 0xf2d2a9;
    public water: Water;

    private size = 100;
    
    constructor() {
        super();

        const heightMap = new THREE.TextureLoader().load('assets/sandHeightmap.png');

        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.size, this.size).rotateX(-Math.PI/2);

        this.material = new THREE.MeshLambertMaterial({
            color: this.sandColor,
            displacementMap: heightMap
        })

        this.position.setY(-0.5);

        this.water = new Water(this.size);
        this.water.position.setY(0.5);
        this.add(this.water);
    }
}
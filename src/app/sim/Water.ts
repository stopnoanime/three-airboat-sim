import * as THREE from 'three';

export class Water extends THREE.Mesh {
    
    public color = 0x13cfd2;
    public override material: THREE.MeshLambertMaterial;

    constructor(size: number) {
        super();

        this.geometry = new THREE.PlaneGeometry(size, size, size, size).rotateX(-Math.PI/2);

        this.material = new THREE.MeshLambertMaterial({
            color: this.color
        });    
    }
}
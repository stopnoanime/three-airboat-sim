import * as THREE from 'three';

/** 
 * Low poly water surface.
 * Inspired by https://jsfiddle.net/prisoner849/79z8jyLk/
 */
export class Water extends THREE.Mesh {

    private vertexData: {
        amplitude: number,
        phase: number
    }[] = [];
    
    constructor(sizeX: number, sizeY: number, color = 0x44ddff, amplitude = 0.2) {
        super();

        this.material = new THREE.MeshLambertMaterial({
            color: color
        });    

        this.geometry = new THREE.PlaneGeometry(sizeX, sizeY, sizeX, sizeY);
        this.geometry.rotateX(-Math.PI/2);

        // Iterate over each vertex
        for(let i=0; i < this.geometry.getAttribute('position').count; i++) {
            this.vertexData.push({
                amplitude: THREE.MathUtils.randFloatSpread(amplitude),
                phase: THREE.MathUtils.randFloat(0, Math.PI)
            })
        }
    }

    public update(time: number) {
        this.vertexData.forEach((d, i) => {
            const y = Math.sin(time + d.phase) * d.amplitude;
            this.geometry.getAttribute('position').setY(i, y);
        })

        this.geometry.getAttribute('position').needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
}
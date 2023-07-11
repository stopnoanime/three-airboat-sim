import * as THREE from 'three';
import * as PLANCK from 'planck'
import { Water } from './Water';

export class Scenery extends THREE.Mesh {

    public override material: THREE.MeshLambertMaterial;
    public sandColor = 0xf2d2a9;

    public body: PLANCK.Body;

    public water: Water;

    public wallsSvgUrl = 'assets/walls.svg'
    public heightmapUrl = 'assets/heightmap.png';

    public size = 100;
    
    constructor(world: PLANCK.World) {
        // THREE
        super();
        
        const heightMap = new THREE.TextureLoader().load(this.heightmapUrl);
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.size * 10, this.size * 10).rotateX(-Math.PI/2);
        this.material = new THREE.MeshLambertMaterial({
            color: this.sandColor,
            displacementMap: heightMap
        })

        this.position.setY(-0.5);

        this.water = new Water(this.size);
        this.water.position.setY(0.5);
        this.add(this.water);

        // PLANCK
        this.body = world.createBody();
        this.convertWallsSvgToShapes().then(s => {
            s.forEach(c => {
                this.body.createFixture({
                    shape: c,
                })
            })
        })
    }

    private async convertWallsSvgToShapes() {
        const res = await fetch(this.wallsSvgUrl)
        const resText = await res.text();
        const svg = new DOMParser().parseFromString(resText, "image/svg+xml")
        
        const shapes = [];
        for(const path of svg.getElementsByTagName("path")) {

            const points = [];
            const length = path.getTotalLength();
            const segments = 100;

            for (let i=0; i < segments; i++) {
                var pt = path.getPointAtLength(i * length / segments);
                points.push(PLANCK.Vec2(pt.x - this.size/2, this.size/2 - pt.y));
            }
            
            shapes.push(PLANCK.Chain(points, true))
        }

        return shapes
    }
}
import * as THREE from 'three';
import * as PLANCK from 'planck'
import { Water } from './Water';
import { environment } from 'src/environments/environment';

export class Scenery extends THREE.Mesh {

    public sandColor = 0xf2d2a9;
    public grassColor = 0x009A17;

    public water: Water;

    public terrainUniforms = {
        heightMap: { value: new THREE.TextureLoader().load(environment.heightMapUrl) },
        heightMapScale: { value: 1 },
        sandColor: { value: new THREE.Color(this.sandColor) },
        grassColor: { value: new THREE.Color(this.grassColor) },
    }

    private body: PLANCK.Body;

    constructor(world: PLANCK.World, size = 100) {
        // THREE
        super();

        this.material =  new THREE.ShaderMaterial({
            uniforms: this.terrainUniforms,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader
        })

        this.geometry = new THREE.PlaneGeometry(size, size, size * 10, size * 10).rotateX(-Math.PI/2).translate(0,-0.1,0);

        // Water
        this.water = new Water(size);
        this.add(this.water);

        // PLANCK
        this.body = world.createBody();
        this.convertWallsSvgToShapes(environment.mapSvgUrl, size).then(s => {
            s.forEach(c => {
                this.body.createFixture({
                    shape: c,
                })
            })
        })
    }

    private async convertWallsSvgToShapes(url: string, mapSize: number) {
        const res = await fetch(url)
        const resText = await res.text();
        const svg = new DOMParser().parseFromString(resText, "image/svg+xml")
        
        const shapes = [];
        for(const path of svg.getElementsByTagName("path")) {

            const points = [];
            const length = path.getTotalLength();
            const segments = 100;

            for (let i=0; i < segments; i++) {
                var pt = path.getPointAtLength(i * length / segments);
                points.push(PLANCK.Vec2(pt.x - mapSize/2, mapSize/2 - pt.y));
            }
            
            shapes.push(PLANCK.Chain(points, true))
        }

        return shapes
    }
}

// Inspired by https://www.youtube.com/watch?app=desktop&v=G0hWjD0n46c

const terrainVertexShader = `
    uniform sampler2D heightMap;
    uniform float heightMapScale;

    varying float vertexHeight;

    void main() {
        vertexHeight = texture2D(heightMap, uv).r;
        
        vec3 newPosition = position + normal * heightMapScale * vertexHeight;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`

const terrainFragmentShader = `
    uniform vec3 sandColor;
    uniform vec3 grassColor;

    varying float vertexHeight;

    void main() {
        vec3 sand = (1.0 - smoothstep(0.6, 0.7, vertexHeight)) * sandColor;
        vec3 grass = smoothstep(0.6, 0.7, vertexHeight) * grassColor;

        gl_FragColor = vec4(sand + grass, 1.0);
    }
`
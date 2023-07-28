import * as THREE from 'three';
import * as PLANCK from 'planck'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Scenery extends THREE.Mesh {

    public sandColor = 0xf2d2a9;
    public grassColor = 0x009A17;

    override material: THREE.ShaderMaterial;

    private body: PLANCK.Body;
    private mapSize: number;

    constructor(
        world: PLANCK.World,
        mapSvg: Document,
        heightMap: THREE.Texture,
        mapSize = 100
    ) {        
        super();

        this.mapSize = mapSize;

        // THREE
        this.material =  new THREE.ShaderMaterial({
            uniforms: {
                heightMap: { value: heightMap },
                sandColor: { value: new THREE.Color(this.sandColor) },
                grassColor: { value: new THREE.Color(this.grassColor) },
            },
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader
        })

        this.geometry = new THREE.PlaneGeometry(mapSize, mapSize, mapSize * 10, mapSize * 10).rotateX(-Math.PI/2);

        // PLANCK
        this.body = world.createBody();
        this.convertSvgPathsToMapWalls(mapSvg, mapSize).forEach(wall => 
            this.body.createFixture({
                shape: wall
            })    
        )
    }

    public async loadMeshes(svg: Document, heightMap: THREE.Texture) {
        const imageData = this.convertTextureToImageData(heightMap);
        const meshLoader = new GLTFLoader();

        return Promise.all([...svg.getElementsByTagName("circle")].map(async point => {
            const cx = Number(point.getAttribute('cx'))
            const cy = Number(point.getAttribute('cy'))
            const type = point.dataset['object'] ?? 'tree';

            const posX = (cx - 1/2) * this.mapSize;
            const posZ = (cy - 1/2) * this.mapSize;

            const imageIdx = Math.round(cy * imageData.height) * imageData.width + Math.round(cx * imageData.width);
            const posY = imageData.data[imageIdx * 4]/255 - 0.2;

            const mesh = await meshLoader.loadAsync(`assets/${type}.glb`);
        
            mesh.scene.scale.multiplyScalar(0.6);
            mesh.scene.position.set(posX, posY, posZ);
            mesh.scene.rotateY(Math.random() * Math.PI*2);
            this.add(mesh.scene);
        }))
    }

    private convertSvgPathsToMapWalls(svg: Document, segments = 200) {
        return [...svg.getElementsByTagName("path")].map(path => {
            const points: PLANCK.Vec2[] = [];
            const length = path.getTotalLength();

            for (let i=0; i < segments; i++) {
                var pt = path.getPointAtLength(i * length / segments);
                points.push(PLANCK.Vec2((pt.x - 1/2) * this.mapSize, (1/2 - pt.y) * this.mapSize));
            }

            return PLANCK.Chain(points, true)
        })
    }

    private convertTextureToImageData(texture: THREE.Texture) {
        const canvas = document.createElement( 'canvas' );
        canvas.width = texture.image.width;
        canvas.height = texture.image.width;

        const canvasContext = canvas.getContext('2d')!;
        canvasContext.drawImage(texture.image, 0, 0);

        return canvasContext.getImageData(0,0, texture.image.width, texture.image.width);
    }
}

// Inspired by https://www.youtube.com/watch?app=desktop&v=G0hWjD0n46c

const terrainVertexShader = `
    uniform sampler2D heightMap;

    varying float vertexHeight;

    void main() {
        vertexHeight = texture2D(heightMap, uv).r;

        vec3 newPosition = position + normal * vertexHeight - 0.15;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`

const terrainFragmentShader = `
    uniform vec3 sandColor;
    uniform vec3 grassColor;

    varying float vertexHeight;

    void main() {
        vec3 sand = (1.0 - smoothstep(0.3, 0.4, vertexHeight)) * sandColor;
        vec3 grass = smoothstep(0.3, 0.4, vertexHeight) * grassColor;

        gl_FragColor = vec4(sand + grass, 1.0);
    }
`
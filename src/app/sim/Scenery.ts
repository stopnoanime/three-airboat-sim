import * as THREE from 'three';
import * as PLANCK from 'planck'
import { Water } from './Water';
import { environment } from 'src/environments/environment';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Scenery extends THREE.Mesh {

    public sandColor = 0xf2d2a9;
    public grassColor = 0x009A17;

    public water: Water;
    public skyBox: THREE.CubeTexture;
    public override geometry: THREE.PlaneGeometry;

    private body: PLANCK.Body;
    private meshLoader = new GLTFLoader();
    private skyBoxLoader = new THREE.CubeTextureLoader();
    private heightMap = new THREE.TextureLoader().load(environment.heightMapUrl, texture => this.applyHeightMap(texture));
    
    public terrainUniforms = {
        heightMap: { value: this.heightMap },
        heightMapScale: { value: 1 },
        sandColor: { value: new THREE.Color(this.sandColor) },
        grassColor: { value: new THREE.Color(this.grassColor) },
    }

    constructor(world: PLANCK.World, mapSize = 100) {
        // THREE
        super();

        this.material =  new THREE.ShaderMaterial({
            uniforms: this.terrainUniforms,
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader
        })

        this.geometry = new THREE.PlaneGeometry(mapSize, mapSize, mapSize * 10, mapSize * 10).rotateX(-Math.PI/2);

        this.skyBox = this.skyBoxLoader.setPath( 'assets/skybox/' ).load([
            'right.bmp', 'left.bmp',
            'top.bmp', 'bottom.bmp',
            'front.bmp', 'back.bmp'
        ]);;

        // Water
        this.water = new Water(mapSize);
        this.add(this.water);

        // PLANCK
        this.body = world.createBody();

        // load mapSVG and process it
        fetch(environment.mapSvgUrl)
        .then(svg => svg.text())
        .then(svgText => {
            const svg = new DOMParser().parseFromString(svgText, "text/html");

            this.loadSvgMeshes(svg, mapSize);

            this.convertSvgPathsToMapWalls(svg, mapSize).forEach(wall => 
                this.body.createFixture({
                    shape: wall
                })    
            )
        })
    }

    // apply height map using JS instead of shader because we need to access terrain height in JS 
    private applyHeightMap(texture: THREE.Texture) {
        const geoS = this.geometry.parameters.widthSegments + 1;
        const imgS = texture.image.width;
        const imgToGeoRatio = imgS / geoS;

        const canvas = document.createElement( 'canvas' );
        canvas.width = imgS;
        canvas.height = imgS;

        const canvasContext = canvas.getContext('2d')!;
        canvasContext.drawImage(texture.image, 0,0);

        const imageData = canvasContext.getImageData(0,0,imgS,imgS).data;
        const verticesData = this.geometry.getAttribute('position');

        for (let h = 0; h < geoS; h++) {
            for (let w = 0; w < geoS; w++) {
                const imageIdx = Math.round(h * imgToGeoRatio) * imgS + Math.round(w * imgToGeoRatio);
                verticesData.setY(h * geoS + w, imageData[imageIdx * 4]/255 - 0.15);
            }
        }

        verticesData.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    private convertSvgPathsToMapWalls(svg: Document, mapSize: number, segments = 100) {
        return [...svg.getElementsByTagName("path")].map(path => {
            const points: PLANCK.Vec2[] = [];
            const length = path.getTotalLength();

            for (let i=0; i < segments; i++) {
                var pt = path.getPointAtLength(i * length / segments);
                points.push(PLANCK.Vec2((pt.x - 1/2) * mapSize, (1/2 - pt.y) * mapSize));
            }

            return PLANCK.Chain(points, true)
        })
    }

    private loadSvgMeshes(svg: Document, mapSize: number) {
        const terrainData = this.geometry.getAttribute('position');
        const geoSize = this.geometry.parameters.widthSegments + 1;

        for(const point of svg.getElementsByTagName("circle")) {
            const cx = Number(point.getAttribute('cx'))
            const cy = Number(point.getAttribute('cy'))
            const type = point.dataset['object'] ?? 'tree';

            this.meshLoader.load(`assets/${type}.glb`, mesh => {
                const posX = (cx - 1/2) * mapSize;
                const posZ = (cy - 1/2) * mapSize;
                const posY = terrainData.getY(Math.floor(cy * geoSize) * geoSize + Math.floor(cx * geoSize))
            
                mesh.scene.scale.multiplyScalar(0.6);
                mesh.scene.position.set(posX, posY, posZ);
                mesh.scene.rotateY(Math.random() * Math.PI*2);
                this.add(mesh.scene);
            })   
        }
    }
}

// Inspired by https://www.youtube.com/watch?app=desktop&v=G0hWjD0n46c

const terrainVertexShader = `
    uniform sampler2D heightMap;
    uniform float heightMapScale;

    varying float vertexHeight;

    void main() {
        vertexHeight = texture2D(heightMap, uv).r;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const terrainFragmentShader = `
    uniform vec3 sandColor;
    uniform vec3 grassColor;

    varying float vertexHeight;

    void main() {
        vec3 sand = (1.0 - smoothstep(0.35, 0.45, vertexHeight)) * sandColor;
        vec3 grass = smoothstep(0.35, 0.45, vertexHeight) * grassColor;

        gl_FragColor = vec4(sand + grass, 1.0);
    }
`
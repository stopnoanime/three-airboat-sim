import * as THREE from 'three';
import { environment } from 'src/environments/environment';

export class Water extends THREE.Mesh {
    
    public waterColorDeep = 0x5aaeba;
    public waterColorShallow = 0x13cfd2;
    public surfaceNoiseCutoff = 0.8;
    public edgeFoamCutoff = 0.6;
    public noiseSpeed = 0.07;
    public noiseSize = 25;

    private textureLoader = new THREE.TextureLoader();

    public waterUniforms = {
        time: { value: 0 },
        heightMap: { value: this.textureLoader.load(environment.waterHeightMapUrl) },
        noiseSpeed: { value: this.noiseSpeed },
        noiseSize: { value: this.noiseSize },
        surfaceNoiseCutoff: { value: this.surfaceNoiseCutoff },
        edgeFoamCutoff: { value: this.edgeFoamCutoff },
        waterColorDeep: { value: new THREE.Color(this.waterColorDeep) },
        waterColorShallow: { value: new THREE.Color(this.waterColorShallow) },
    }

    override material: THREE.ShaderMaterial;

    constructor(size: number) {
        super();

        this.geometry = new THREE.PlaneGeometry(size, size, size, size).rotateX(-Math.PI/2);

        this.material =  new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                this.waterUniforms,
                THREE.UniformsLib.lights,
            ]),
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            lights: true,
        })

        this.receiveShadow = true;
    }

    public updateTime(t: number) {
        this.material.uniforms['time'].value = t;
    }
}

//Info on how to make shader material with shadows taken from here: https://gist.github.com/wmcmurray/6696fc95f25bbd2401d72a74e9493261

const waterVertexShader = `
    #include <common>
    #include <shadowmap_pars_vertex>

    uniform sampler2D heightMap;

    varying vec2 vUv;
    varying float vertexHeight;
    
    void main() {
        #include <begin_vertex>
        #include <beginnormal_vertex>
        #include <project_vertex>
        #include <worldpos_vertex>
        #include <defaultnormal_vertex> 
        #include <shadowmap_vertex>

        vUv = uv;
        vertexHeight = texture2D(heightMap, uv).r;
    }
`

const waterFragmentShader = `
    #include <common>
    #include <packing>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    #include <noise_3d>
    
    uniform float time;
    uniform vec3 waterColorDeep;
    uniform vec3 waterColorShallow;
    uniform float surfaceNoiseCutoff;
    uniform float edgeFoamCutoff;
    uniform float noiseSpeed;
    uniform float noiseSize;

    varying vec2 vUv;
    varying float vertexHeight;

    void main() {
        vec3 deep = (1.0 - smoothstep(0.0, 0.3, vertexHeight)) * waterColorDeep;
        vec3 shallow = smoothstep(0.0, 0.3, vertexHeight) * waterColorShallow;

        float noise = snoise(vec3(vUv.x * noiseSize, vUv.y * noiseSize, time * noiseSpeed))/2.0 + 0.5;
        float edgeFoamModifier = clamp( (1.0 - vertexHeight) / edgeFoamCutoff, 0.0, 1.0);
        bool surfaceNoise = noise > surfaceNoiseCutoff * edgeFoamModifier;
        
        vec3 finalColor = surfaceNoise ? vec3(1,1,1) : deep + shallow;

        gl_FragColor = vec4( mix(finalColor, vec3(0, 0, 0), (1.0 - getShadowMask() ) * 0.5), 1.0);
    }
`
import * as THREE from 'three';
import { environment } from 'src/environments/environment';

export class Water extends THREE.Mesh {
    
    public waterColorDeep = 0x5aaeba;
    public waterColorShallow = 0x13cfd2;
    public surfaceNoiseCutoff = 0.65;
    public edgeFoamCutoff = 0.45;
    public distortionMapSpeed = 0.02;
    public distortionMapStrength = 0.02;

    private textureLoader = new THREE.TextureLoader();

    public waterUniforms = {
        time: { value: 0 },
        heightMap: { value: this.textureLoader.load(environment.waterHeightMapUrl) },
        noiseMap: { value: this.textureLoader.load(environment.waterNoiseMapUrl) },
        distortionMap: { value: this.textureLoader.load(environment.waterDistortionMapUrl) },
        distortionMapSpeed: { value: this.distortionMapSpeed },
        distortionMapStrength: { value: this.distortionMapStrength },
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

    uniform float time;
    uniform sampler2D heightMap;
    uniform sampler2D noiseMap;
    uniform sampler2D distortionMap;
    uniform float distortionMapSpeed;
    uniform float distortionMapStrength;

    varying float vertexHeight;
    varying float noise;
    
    void main() {
        #include <begin_vertex>
        #include <beginnormal_vertex>
        #include <project_vertex>
        #include <worldpos_vertex>
        #include <defaultnormal_vertex> 
        #include <shadowmap_vertex>

        vertexHeight = texture2D(heightMap, uv).r;

        vec2 distortionUv = uv;
        distortionUv.x = mod(distortionUv.x + time * distortionMapSpeed, 1.0);
        distortionUv.y = mod(distortionUv.y + time * distortionMapSpeed, 1.0);
        vec4 distortion = texture2D(distortionMap, distortionUv);

        vec2 noiseUv = uv;
        noiseUv.x = mod(noiseUv.x + distortion.r * distortionMapStrength, 1.0); 
        noiseUv.y = mod(noiseUv.y + distortion.g * distortionMapStrength, 1.0); 
        noise = texture2D(noiseMap, noiseUv).r;
    }
`

const waterFragmentShader = `
    #include <common>
    #include <packing>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    
    uniform vec3 waterColorDeep;
    uniform vec3 waterColorShallow;
    uniform float surfaceNoiseCutoff;
    uniform float edgeFoamCutoff;

    varying float vertexHeight;
    varying float noise;

    void main() {
        vec3 deep = (1.0 - smoothstep(0.0, 0.3, vertexHeight)) * waterColorDeep;
        vec3 shallow = smoothstep(0.0, 0.3, vertexHeight) * waterColorShallow;

        float edgeFoamModifier = clamp( (1.0 - vertexHeight) / edgeFoamCutoff, 0.0, 1.0);
        bool surfaceNoise = noise > surfaceNoiseCutoff * edgeFoamModifier;
        
        vec3 finalColor = surfaceNoise ? vec3(1,1,1) : deep + shallow;

        // mix final color and shadows
        gl_FragColor = vec4( mix(finalColor, vec3(0, 0, 0), (1.0 - getShadowMask() ) * 0.5), 1.0);
    }
`
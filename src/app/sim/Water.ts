import * as THREE from 'three';
import { environment } from 'src/environments/environment';

export class Water extends THREE.Mesh {
    
    public waterColorDeep = 0x5aaeba;
    public waterColorShallow = 0x13cfd2;

    public waterUniforms = {
        heightMap: { value: new THREE.TextureLoader().load(environment.waterHeightMapUrl) },
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
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            lights: true,
        })

        this.receiveShadow = true;
    }
}

//Info on how to make shader material with shadows taken from here: https://gist.github.com/wmcmurray/6696fc95f25bbd2401d72a74e9493261

const terrainVertexShader = `
    #include <common>
    #include <shadowmap_pars_vertex>

    uniform sampler2D heightMap;

    varying float vertexHeight;
    
    void main() {
        #include <begin_vertex>
        #include <beginnormal_vertex>
        #include <project_vertex>
        #include <worldpos_vertex>
        #include <defaultnormal_vertex> 
        #include <shadowmap_vertex>

        vertexHeight = texture2D(heightMap, uv).r;
    }
`

const terrainFragmentShader = `
    #include <common>
    #include <packing>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    
    uniform vec3 waterColorDeep;
    uniform vec3 waterColorShallow;

    varying float vertexHeight;

    void main() {   
        vec3 deep = (1.0 - smoothstep(0.0, 0.3, vertexHeight)) * waterColorDeep;
        vec3 shallow = smoothstep(0.0, 0.3, vertexHeight) * waterColorShallow;
        vec3 finalColor = deep + shallow;

        gl_FragColor = vec4( mix(finalColor, vec3(0, 0, 0), (1.0 - getShadowMask() ) * 0.5), 1.0);
    }
`
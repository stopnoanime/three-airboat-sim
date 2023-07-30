import * as THREE from 'three';
import * as PLANCK from 'planck';
import { Howl } from 'howler';
import { axisValues } from './KeyboardController';
import { environment } from 'src/environments/environment';

export class Airboat extends THREE.Object3D {

    public body: PLANCK.Body;

    public sound: Howl;

    public settings = {
        velocityTurningTorque: 0.05,
        thrustTurningTorque: 0.9,
        turningFriction: 0.6,
        sidewaysDrag: 2,
        frontalDrag: 0.2,
        thrust: 2.5,
        baseCameraDistance: 1,
        cameraDistanceVelocityScale: 0.2,
        yPosition: 0.04,
        mainColor: 0xef4444,
        accentColor: 0xfb923c,
        lineColor: 0x404040,
        wakeLength: 0.5,
        foamColor: 0xe2fdff,
        swayMultiplierX: 0.015,
        swayMaxX: 0.05,
        swayMultiplierZ: 0.015,
        swayMaxZ: 0.04,
    }

    public mainMaterial: THREE.MeshLambertMaterial;
    public accentMaterial: THREE.MeshLambertMaterial;
    public lineMaterial: THREE.LineBasicMaterial;
    public wakeMaterial: THREE.ShaderMaterial;
    public foamMaterial: THREE.ShaderMaterial;

    private hull: THREE.Mesh;
    private propeller: THREE.Mesh;
    private rudder: THREE.Mesh;
    private engine: THREE.Mesh;
    private propMount: THREE.Mesh;
    private wake: THREE.Mesh;
    private foam: THREE.Points;

    private debugArrow?: THREE.ArrowHelper;

    public get speed() {
        return this.body.getLinearVelocity().length();
    }

    constructor(world: PLANCK.World) {
        //THREE
        super();

        //shapes
        const hullShape = new THREE.Shape();
        hullShape.moveTo( 0,0 );
        hullShape.lineTo( 0, -0.05 );
        hullShape.lineTo( 0.25, -0.05 );
        hullShape.bezierCurveTo(0.3, -0.05, 0.35, -0.05, 0.4, 0)
        hullShape.lineTo( 0, 0 );

        const propMountShape = new THREE.Shape();
        propMountShape.moveTo(0,0);
        propMountShape.lineTo(0.05,0);
        propMountShape.lineTo(0.02,0.14);
        propMountShape.lineTo(0,0.14);
        propMountShape.lineTo( 0, 0 );

        const propShape = new THREE.Shape();
        propShape.ellipse(0,0, 0.08, 0.005,0, Math.PI*2, false, 0);

        //geometries
        const hullGeometry = new THREE.ExtrudeGeometry( hullShape, {
            bevelEnabled: false,
            depth: 0.22
        })

        const propMountGeometry = new THREE.ExtrudeGeometry( propMountShape, {
            bevelEnabled: false,
            depth: 0.002
        }).translate(0, 0.001, -0.001);

        const propellerGeometry =  new THREE.ExtrudeGeometry( propShape, {
            bevelEnabled: false,
            depth: 0.002
        }).rotateY(-Math.PI/2);

        const engineGeometry = new THREE.CylinderGeometry(0.01,0.01,0.03).rotateZ(Math.PI/2);
        const rudderGeometry = new THREE.BoxGeometry(0.04,0.14,0.002).translate(-0.02,0,0);
        const wakeGeometry = new THREE.PlaneGeometry(this.settings.wakeLength,0.12).rotateX(-Math.PI/2)

        //materials
        this.mainMaterial = new THREE.MeshLambertMaterial({color: this.settings.mainColor});
        this.accentMaterial = new THREE.MeshLambertMaterial({color: this.settings.accentColor});
        this.lineMaterial = new THREE.LineBasicMaterial({color: this.settings.lineColor});
        this.foamMaterial = new THREE.ShaderMaterial({
            uniforms: { 
                time: {value: 0}, vel: {value: 0}, velAngle: {value: 0},
                color: {value: new THREE.Color(this.settings.foamColor)}
            },
            vertexShader: foamVertexShader,
            fragmentShader: foamFragmentShader,
            transparent: true
        });
        this.wakeMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                { time: { value: 0 }, throttle: { value: 0 } },
                THREE.UniformsLib.lights,
            ]),
            vertexShader: wakeVertexShader,
            fragmentShader: wakeFragmentShader,
            lights: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            transparent: true
        })
        
        //meshes
        this.hull = new THREE.Mesh(hullGeometry, this.mainMaterial);
        this.rudder = new THREE.Mesh(rudderGeometry, this.accentMaterial)
        this.propeller = new THREE.Mesh(propellerGeometry, this.accentMaterial)
        this.propMount = new THREE.Mesh(propMountGeometry, this.mainMaterial);
        this.engine = new THREE.Mesh(engineGeometry, new THREE.MeshLambertMaterial({color: this.settings.lineColor}))
        this.wake = new THREE.Mesh(wakeGeometry, this.wakeMaterial)
        this.foam = new THREE.Points(this.generateFoamGeometry(), this.foamMaterial );

        //mesh edges
        this.hull.add( new THREE.LineSegments(new THREE.EdgesGeometry(hullGeometry), this.lineMaterial));
        this.rudder.add( new THREE.LineSegments(new THREE.EdgesGeometry(rudderGeometry), this.lineMaterial));
        this.propMount.add( new THREE.LineSegments(new THREE.EdgesGeometry(propMountGeometry), this.lineMaterial));

        //shadows
        this.hull.castShadow = true;
        this.hull.receiveShadow = true;
        this.rudder.castShadow = true;
        this.rudder.receiveShadow = true;
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;
        this.engine.castShadow = true;
        this.engine.receiveShadow = true;
        this.propMount.castShadow = true;
        this.propMount.receiveShadow = true;
        this.wake.receiveShadow = true;

        //assemble airboat
        this.hull.position.set(-0.2,0,-0.11)
        this.rudder.position.set(0,0.07,0.11);
        this.propeller.position.set(0.054,0.1,0.11);
        this.engine.position.set(0.035,0.1,0.11);
        this.propMount.position.set(0,0,0.11);
        this.wake.position.set(-0.2 - this.settings.wakeLength/2, -this.settings.yPosition,0);
        this.foam.position.set(-0.2, -this.settings.yPosition, 0);

        this.hull.add(this.propeller, this.rudder, this.engine, this.propMount)
        this.add(this.hull, this.wake, this.foam);
        this.position.setY(this.settings.yPosition);
        
        if(environment.DEBUG) {
            this.debugArrow = new THREE.ArrowHelper()
            this.debugArrow.position.setY(0.1)
            this.add(this.debugArrow)
        }

        //PLANCK
        this.body = world.createBody({
            type: 'dynamic',
        });

        this.body.createFixture({
            shape: new PLANCK.Box(0.2,0.11),
            friction: 0,
        })

        this.body.setMassData({
            center: PLANCK.Vec2(0,0),
            I: 1,
            mass: 1
        })
        
        //Sounds
        this.sound = new Howl({
            src: ['assets/prop.mp3'],
            volume: 0,
            loop: true,
        });
    }

    public updateCamera(camera: THREE.PerspectiveCamera, angle: number) {
        const cameraDistance = Math.max(this.settings.baseCameraDistance, this.settings.baseCameraDistance * this.body.getLinearVelocity().length() * this.settings.cameraDistanceVelocityScale)
        const cameraOffset = 
            new THREE.Vector3(- cameraDistance, cameraDistance * 0.6, 0)
            .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

        camera.position.copy(cameraOffset.applyQuaternion(this.quaternion).add(this.position));
        camera.lookAt(this.position)
    }

    public calculateForces(axisValues: axisValues) {
        const force = new PLANCK.Vec2();

        // Thrust
        force.add(PLANCK.Vec2(axisValues.throttle * this.settings.thrust,0));
        
        // Steering 
        const turningTorque = Math.sin(- axisValues.yaw * Math.PI/2) * ( 
            axisValues.throttle * this.settings.thrustTurningTorque + 
            this.body.getLinearVelocity().length() * this.settings.velocityTurningTorque
        ); 
        const turningFriction = this.settings.turningFriction * this.body.getAngularVelocity();
        this.body.applyTorque(turningTorque - turningFriction);

        // Drag
        const localDrag = this.body.getLocalVector(this.body.getLinearVelocity().clone().neg());
        localDrag.x *= this.settings.frontalDrag;
        localDrag.y *= this.settings.sidewaysDrag;
        force.add(localDrag);

        // Apply the calculated force
        this.body.applyForceToCenter(this.body.getWorldVector(force));
        this.applySway(force);

        // Update look and sounds based on axis values
        this.updateControlSurfaces(axisValues);
        this.updateSound(axisValues);
    }

    public syncBodyAndMesh() {
        const pos = this.body.getPosition();
        
        //Planck and Three Y/Z axis is flipped 
        this.position.set(pos.x, this.settings.yPosition, -pos.y);
        this.rotation.set(0, this.body.getAngle(), 0);

        //Pass data to shaders
        const vel = this.body.getLocalVector(this.body.getLinearVelocity());
        this.foamMaterial.uniforms['vel'].value = vel.length();
        this.foamMaterial.uniforms['velAngle'].value = Math.atan2(vel.y, vel.x)

        if(this.debugArrow) {
            const vel = this.body.getLocalVector(this.body.getLinearVelocity().clone())
            vel.normalize();
            this.debugArrow.setDirection(new THREE.Vector3(vel.x, 0, -vel.y));
            this.debugArrow.setLength(this.body.getLinearVelocity().length()/4)
        }
    }

    public reset() {
        this.body.setPosition(PLANCK.Vec2());
        this.body.setAngle(0);
        this.body.setLinearVelocity(PLANCK.Vec2())
        this.body.setAngularVelocity(0);
    }

    public updateTime(t: number) {
        this.wakeMaterial.uniforms['time'].value = t;
        this.foamMaterial.uniforms['time'].value = t;
    }

    private updateControlSurfaces(axisValues: axisValues) {
        this.propeller.rotateX(axisValues.throttle);
        this.rudder.rotation.set(0, axisValues.yaw * Math.PI/4, 0);
        this.wakeMaterial.uniforms['throttle'].value = axisValues.throttle;
    }

    private updateSound(axisValues: axisValues) {
        this.sound.volume(Math.abs(axisValues.throttle));
    }

    private applySway(force: PLANCK.Vec2) {
        this.hull.rotation.x = - THREE.MathUtils.clamp(force.y * this.settings.swayMultiplierX, -this.settings.swayMaxX, this.settings.swayMaxX);
        this.hull.rotation.z = THREE.MathUtils.clamp(force.x * this.settings.swayMultiplierZ, -this.settings.swayMaxZ, this.settings.swayMaxZ);
    }

    private generateFoamGeometry() {
        const foamPosition = [];
        const foamJumpHeight = [];
        const foamJumpLength = [];
        const foamJumpSpeed = [];
        const foamJumpStop = [];
        const foamJumpAngleMod = [];

        for ( let i = 0; i < 200; i ++ ) {
            foamPosition.push( 0, 0, THREE.MathUtils.randFloatSpread( 0.22 ));
            foamJumpHeight.push(THREE.MathUtils.randFloat(0.2, 1));
            foamJumpLength.push(THREE.MathUtils.randFloat(0.2, 1));
            foamJumpSpeed.push(THREE.MathUtils.randFloat(0.8, 1));
            foamJumpStop.push(THREE.MathUtils.randFloat(0.5, 1));
            foamJumpAngleMod.push(THREE.MathUtils.randFloatSpread( 0.8 ));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( foamPosition, 3 ) );
        geometry.setAttribute( 'jumpHeight', new THREE.Float32BufferAttribute( foamJumpHeight, 1 ) );
        geometry.setAttribute( 'jumpLength', new THREE.Float32BufferAttribute( foamJumpLength, 1 ) );
        geometry.setAttribute( 'jumpSpeed', new THREE.Float32BufferAttribute( foamJumpSpeed, 1 ) );
        geometry.setAttribute( 'jumpStop', new THREE.Float32BufferAttribute( foamJumpStop, 1 ) );
        geometry.setAttribute( 'jumpAngleMod', new THREE.Float32BufferAttribute( foamJumpAngleMod, 1 ) );

        return geometry
    }
}

const wakeVertexShader = `
    #include <common>
    #include <shadowmap_pars_vertex>
    
    varying vec2 vUv;

    void main() {
        #include <begin_vertex>
        #include <beginnormal_vertex>
        #include <project_vertex>
        #include <worldpos_vertex>
        #include <defaultnormal_vertex> 
        #include <shadowmap_vertex>

        vUv = uv;
    }
`

const wakeFragmentShader = `
    #include <common>
    #include <packing>
    #include <lights_pars_begin>
    #include <shadowmap_pars_fragment>
    #include <shadowmask_pars_fragment>
    #include <noise_3d>

    uniform float time;
    uniform float throttle;

    varying vec2 vUv;

    void main() {
        float noise = 0.5 + snoise(vec3(vUv.x*6.0, vUv.y*2.0, time*3.0))/2.0;
        float chance = sin(vUv.y * 3.1415) * sin(vUv.x * 3.1415);
        bool transparent = noise > chance;

        gl_FragColor = vec4( mix(vec3(1,1,1), vec3(0,0,0), (1.0 - getShadowMask() ) * 0.5), transparent ? 0.0 : throttle);
    }
`

const foamVertexShader = `
    uniform float time;
    uniform float vel;
    uniform float velAngle;

    attribute float jumpHeight;
    attribute float jumpLength;
    attribute float jumpSpeed;
    attribute float jumpStop;
    attribute float jumpAngleMod;

    varying float jumpProgress;
    varying float jumpEnd;

    void main() {
        float x = mod(time * jumpSpeed, jumpLength);

        jumpProgress = x / jumpLength;
        jumpEnd = jumpStop;

        float y = - jumpHeight * x * (x - jumpLength);

        float angle = velAngle + jumpAngleMod;
        float realX = cos(angle) * -x;
        float realZ = sin(angle) * x;

        vec3 offset = vec3(realX, y, realZ) * vel / 10.0;

        gl_PointSize = 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1);
    }
`

const foamFragmentShader = `
    uniform vec3 color;

    varying float jumpProgress;
    varying float jumpEnd;

    void main() {
        if(jumpProgress >= jumpEnd) discard; 

        float opacity = (1.0 - smoothstep(jumpEnd - 0.2, jumpEnd, jumpProgress));
        gl_FragColor = vec4(color, opacity);
    }
`
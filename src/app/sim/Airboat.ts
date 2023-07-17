import * as THREE from 'three';
import * as PLANCK from 'planck';
import { axisValues } from './KeyboardController';
import { environment } from 'src/environments/environment';

export class Airboat extends THREE.Object3D {

    public body: PLANCK.Body;

    public settings = {
        velocityTurningTorque: 0.05,
        thrustTurningTorque: 0.9,
        turningFriction: 0.6,
        sidewaysDrag: 2,
        frontalDrag: 0.2,
        thrust: 2.5,
        baseCameraDistance: 1,
        cameraDistanceVelocityScale: 0.25,
        yPosition: 0.04,
        mainColor: 0xef4444,
        accentColor: 0xfb923c,
        lineColor: 0x404040,
    }

    public mainMaterial: THREE.MeshLambertMaterial;
    public accentMaterial: THREE.MeshLambertMaterial;
    public lineMaterial: THREE.LineBasicMaterial;

    private hull: THREE.Mesh;
    private propeller: THREE.Mesh;
    private rudder: THREE.Mesh;
    private engine: THREE.Mesh;
    private propMount: THREE.Mesh;

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

        //materials
        this.mainMaterial = new THREE.MeshLambertMaterial({color: this.settings.mainColor});
        this.accentMaterial = new THREE.MeshLambertMaterial({color: this.settings.accentColor});
        this.lineMaterial = new THREE.LineBasicMaterial({color: this.settings.lineColor});

        //meshes
        this.hull = new THREE.Mesh(hullGeometry, this.mainMaterial);
        this.rudder = new THREE.Mesh(rudderGeometry, this.accentMaterial)
        this.propeller = new THREE.Mesh(propellerGeometry, this.accentMaterial)
        this.propMount = new THREE.Mesh(propMountGeometry, this.mainMaterial);
        this.engine = new THREE.Mesh(engineGeometry, new THREE.MeshLambertMaterial({color: this.settings.lineColor}))

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

        //assemble airboat
        this.hull.position.set(-0.2,0,-0.11)
        this.rudder.position.set(-0.2,0.07,0);
        this.propeller.position.set(-0.146,0.1,0);
        this.engine.position.set(-0.165,0.1,0);
        this.propMount.position.set(-0.2,0,0);

        this.add(this.hull, this.propeller, this.rudder, this.engine, this.propMount);
        this.position.setY(this.settings.yPosition);

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

        if(environment.DEBUG) {
            this.debugArrow = new THREE.ArrowHelper()
            this.debugArrow.position.setY(0.1)
            this.add(this.debugArrow)
        }
    }

    public updateCamera(camera: THREE.PerspectiveCamera, angle: number) {
        const cameraDistance = Math.max(this.settings.baseCameraDistance, this.settings.baseCameraDistance * this.body.getLinearVelocity().length() * this.settings.cameraDistanceVelocityScale)
        const cameraOffset = 
            new THREE.Vector3(- cameraDistance, cameraDistance * 0.5, 0)
            .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

        camera.position.copy(cameraOffset.applyQuaternion(this.quaternion).add(this.position));
        camera.lookAt(this.position)
    }

    public calculateForces(axisValues: axisValues) {
        this.updateControlSurfaces(axisValues);

        // Thrust
        this.body.applyForceToCenter(this.body.getWorldVector(PLANCK.Vec2(axisValues.throttle * this.settings.thrust,0)));
        
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
        this.body.applyForceToCenter(this.body.getWorldVector(localDrag))
    }

    public syncBodyAndMesh() {
        const pos = this.body.getPosition();
        
        //Planck and Three Y/Z axis is flipped 
        this.position.set(pos.x, this.settings.yPosition, -pos.y);
        this.rotation.set(0, this.body.getAngle(), 0);

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

    private updateControlSurfaces(axisValues: axisValues) {
        this.propeller.rotateX(axisValues.throttle);
        this.rudder.rotation.set(0, axisValues.yaw * Math.PI/4, 0)
    }
}
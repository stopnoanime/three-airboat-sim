import * as THREE from 'three';
import { axisValues } from './KeyboardController';
import { environment } from 'src/environments/environment';

export class Airboat extends THREE.Object3D {

    public velocity = new THREE.Vector3();
    public rotationalVelocity = 0;

    public force = new THREE.Vector3();
    public turningForce = 0;

    public settings = {
        velocityTurningTorque: 0.035,
        thrustTurningTorque: 0.4,
        turningFriction: 0.6,
        sidewaysDrag: 1,
        frontalDrag: 0.2,
        thrust: 2,
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

    private debugArrow?: THREE.ArrowHelper;

    public get speed() {
        return this.velocity.clone().applyQuaternion(this.quaternion.clone().invert()).x;
    }

    constructor() {
        super();

        const hullShape = new THREE.Shape();
        hullShape.moveTo( 0,0 );
        hullShape.lineTo( 0, -0.05 );
        hullShape.lineTo( 0.25, -0.05 );
        hullShape.bezierCurveTo(0.3, -0.05, 0.35, -0.05, 0.4, 0)
        hullShape.lineTo( 0, 0 );

        const propMountShape = new THREE.Shape();
        propMountShape.moveTo(0,0);
        propMountShape.lineTo(0.06,0);
        propMountShape.lineTo(0.02,0.14);
        propMountShape.lineTo(0,0.14);
        propMountShape.lineTo( 0, 0 );

        const propShape = new THREE.Shape();
        propShape.ellipse(0,0, 0.08, 0.005,0, Math.PI*2, false, 0);

        const hullGeometry = new THREE.ExtrudeGeometry( hullShape, {
            bevelEnabled: false,
            depth: 0.22
        })

        const propMountGeometry = new THREE.ExtrudeGeometry( propMountShape, {
            bevelEnabled: false,
            depth: 0.002
        }).translate(0,0.001,0.11 - 0.001);

        const propellerGeometry =  new THREE.ExtrudeGeometry( propShape, {
            bevelEnabled: false,
            depth: 0.002
        }).rotateY(-Math.PI/2);

        const engineGeometry = new THREE.CylinderGeometry(0.01,0.01,0.04).rotateZ(Math.PI/2).translate(0.045,0.1,0.11);
        const rudderGeometry = new THREE.BoxGeometry(0.14,0.04,0.002).translate(0,-0.02,0).rotateZ(-Math.PI/2);

        this.mainMaterial = new THREE.MeshLambertMaterial({color: this.settings.mainColor});
        this.accentMaterial = new THREE.MeshLambertMaterial({color: this.settings.accentColor});
        this.lineMaterial = new THREE.LineBasicMaterial({color: this.settings.lineColor});

        this.hull = new THREE.Mesh(hullGeometry, this.mainMaterial);
        this.hull.add( new THREE.Mesh(propMountGeometry, this.mainMaterial))
        this.hull.add( new THREE.Mesh(engineGeometry, new THREE.MeshLambertMaterial({color: this.settings.lineColor})))
        this.hull.add( new THREE.LineSegments(new THREE.EdgesGeometry(hullGeometry), this.lineMaterial));
        this.hull.add( new THREE.LineSegments(new THREE.EdgesGeometry(propMountGeometry), this.lineMaterial));

        this.rudder = new THREE.Mesh(rudderGeometry, this.accentMaterial)
        this.rudder.add( new THREE.LineSegments(new THREE.EdgesGeometry(rudderGeometry), this.lineMaterial));

        this.propeller = new THREE.Mesh(propellerGeometry, this.accentMaterial)

        this.hull.position.set(-0.2,0,-0.11)
        this.rudder.position.set(-0.2,0.07,0);
        this.propeller.position.set(-0.132,0.1,0);

        this.position.setY(this.settings.yPosition);

        this.add(this.hull, this.propeller, this.rudder);

        if(environment.DEBUG) {
            this.debugArrow = new THREE.ArrowHelper()
            this.debugArrow.position.setY(0.25)
            this.add(this.debugArrow)
        }
    }

    public updateCamera(camera: THREE.PerspectiveCamera, angle: number) {
        const cameraDistance = Math.max(this.settings.baseCameraDistance, this.settings.baseCameraDistance * this.velocity.length() * this.settings.cameraDistanceVelocityScale)
        const cameraOffset = 
            new THREE.Vector3(- cameraDistance, cameraDistance * 0.5, 0)
            .applyAxisAngle(new THREE.Vector3(0,1,0), angle);

        camera.position.copy(cameraOffset.applyQuaternion(this.quaternion).add(this.position));
        camera.lookAt(this.position)
    }

    public calculateForces(axisValues: axisValues) {
        this.updateControlSurfaces(axisValues);

        // Thrust
        this.force.add(new THREE.Vector3(axisValues.throttle * this.settings.thrust).applyQuaternion(this.quaternion));

        // Steering 
        const turningTorque = Math.sin(- axisValues.yaw * Math.PI/2) * ( 
            axisValues.throttle * this.settings.thrustTurningTorque + 
            this.velocity.length() * this.settings.velocityTurningTorque
        ); 
        const turningFriction = this.settings.turningFriction * this.rotationalVelocity;
        this.turningForce = turningTorque - turningFriction;

        // Drag
        const localDrag = this.velocity.clone().negate().applyQuaternion(this.quaternion.clone().invert())
        localDrag.x *= this.settings.frontalDrag;
        localDrag.z *= this.settings.sidewaysDrag;
        this.force.add(localDrag.applyQuaternion(this.quaternion))
    }

    public integrate(dt = 1/60) {
        // Angular calculation
        this.rotationalVelocity += this.turningForce * dt;
        this.rotateY(this.rotationalVelocity * dt);

        // Linear calculation
        this.velocity.add(this.force.clone().multiplyScalar(dt));
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        
        //Reset forces acting on object
        this.force.set(0,0,0);
        this.turningForce = 0;

        if(this.debugArrow) 
            this.debugArrow.setDirection(this.velocity.clone().applyQuaternion(this.quaternion.clone().invert()).normalize())
    }

    public reset() {
        this.force.set(0,0,0);
        this.turningForce = 0;
        this.velocity.set(0,0,0);
        this.rotationalVelocity = 0;
        this.position.set(0,this.settings.yPosition,0);
        this.rotation.set(0,0,0);
    }

    private updateControlSurfaces(axisValues: axisValues) {
        this.propeller.rotateX(axisValues.throttle);
        this.rudder.rotation.set(0, axisValues.yaw * Math.PI/4, 0)
    }
}
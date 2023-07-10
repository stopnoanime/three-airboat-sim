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
        cameraDistance: 2,
        yPosition: 0.04
    }

    private debugArrow?: THREE.ArrowHelper;

    private hull: THREE.Object3D;
    private propeller: THREE.Object3D;
    private rudder: THREE.Object3D;

    public get speed() {
        return this.velocity.clone().applyQuaternion(this.quaternion.clone().invert()).x;
    }

    constructor() {
        super();

        const hullShape = new THREE.Shape();
        hullShape.moveTo( 0,0 );
        hullShape.lineTo( 0, -0.05 );
        hullShape.lineTo( 0.25, -0.05 );
        hullShape.lineTo( 0.40, 0 );
        hullShape.lineTo( 0, 0 );

        const hullGeometry = new THREE.ExtrudeGeometry( hullShape, {
            bevelEnabled: false,
            depth: 0.22
        })

        this.hull = new THREE.Mesh(hullGeometry, new THREE.MeshStandardMaterial({color: 0xff0000}))
        this.propeller = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.002,0.01), new THREE.MeshStandardMaterial({color: 0x000000}))
        this.rudder = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.04,0.005).translate(0,-0.02,0), new THREE.MeshStandardMaterial({color: 0x0000ff}))

        this.hull.position.set(-0.2,0,-0.11)

        this.propeller.position.set(-0.1,0.1,0);
        this.propeller.rotateZ(-Math.PI/2);

        this.rudder.position.set(-0.2,0.07,0);
        this.rudder.rotateZ(-Math.PI/2)

        this.position.setY(this.settings.yPosition);

        this.add(this.hull, this.propeller, this.rudder);

        if(environment.DEBUG) {
            this.debugArrow = new THREE.ArrowHelper()
            this.debugArrow.position.setY(0.25)
            this.add(this.debugArrow)
        }
    }

    public updateCamera(camera: THREE.PerspectiveCamera, angle: number) {
        const cameraOffset = 
            new THREE.Vector3(- this.settings.cameraDistance, this.settings.cameraDistance * 0.5, 0)
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
        this.propeller.rotateY(axisValues.throttle);
        this.rudder.rotation.set(0,axisValues.yaw * Math.PI/4, -Math.PI/2);
    }
}
import * as THREE from 'three';
import { axisValues } from './KeyboardController';

export class Airboat extends THREE.Object3D {

    public velocity = new THREE.Vector3();
    public rotationalVelocity = 0;

    public force = new THREE.Vector3();
    public turningForce = 0;

    public velocityTurningTorqueMultiplier = 0.035;
    public thrustTurningTorqueMultiplier = 0.4;
    public turningFrictionMultiplier = 0.6;
    public sidewaysDragMultiplier = 1;
    public frontalDragMultiplier = 0.2;
    public thrustMultiplier = 2;

    private debugArrow?: THREE.ArrowHelper;

    public get speed() {
        return this.velocity.clone().applyQuaternion(this.quaternion.clone().invert()).x;
    }

    constructor(debugArrow = false) {
        super();

        this.add(new THREE.Mesh(new THREE.BoxGeometry(1,0.2,0.4), new THREE.MeshBasicMaterial({color: 0xff0000})) )

        if(debugArrow) {
            this.debugArrow = new THREE.ArrowHelper()
            this.debugArrow.position.setY(0.25)
            this.add(this.debugArrow)
        } 
    }

    public updateCamera(camera: THREE.PerspectiveCamera) {
        const cameraOffset = new THREE.Vector3(-5,3,0).applyQuaternion(this.quaternion);
        camera.position.copy(cameraOffset.add(this.position));
        camera.lookAt(this.position)
    }

    public calculateForces(axisValues: axisValues) {
        // Thrust
        this.force.add(new THREE.Vector3(axisValues.throttle * this.thrustMultiplier).applyQuaternion(this.quaternion));

        // Steering 
        const turningTorque = Math.sin(- axisValues.yaw * Math.PI/2) * ( 
            axisValues.throttle * this.thrustTurningTorqueMultiplier + 
            this.velocity.length() * this.velocityTurningTorqueMultiplier
        ); 
        const turningFriction = this.turningFrictionMultiplier * this.rotationalVelocity;
        this.turningForce = turningTorque - turningFriction;

        // Drag
        const localDrag = this.velocity.clone().negate().applyQuaternion(this.quaternion.clone().invert())
        localDrag.x *= this.frontalDragMultiplier;
        localDrag.z *= this.sidewaysDragMultiplier;
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

        if(this.debugArrow) this.debugArrow.setDirection(this.velocity.clone().applyQuaternion(this.quaternion.clone().invert()).normalize())
    }
}
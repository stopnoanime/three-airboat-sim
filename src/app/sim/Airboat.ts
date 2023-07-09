import * as THREE from 'three';
import { axisValues } from './KeyboardController';

export class Airboat extends THREE.Object3D {

    /** Local velocity */
    public velocity = new THREE.Vector3();

    /** Local force */
    public force = new THREE.Vector3();
    public mass = 1;

    constructor() {
        super();

        this.add(new THREE.Mesh(new THREE.BoxGeometry(1,0.2,0.4), new THREE.MeshBasicMaterial({color: 0xffff00})) )
    }

    public updateCamera(camera: THREE.PerspectiveCamera) {
        const cameraOffset = new THREE.Vector3(-5,3,0).applyQuaternion(this.quaternion);
        camera.position.copy(cameraOffset.add(this.position));
        camera.lookAt(this.position)
    }

    public calculateForces(axisValues: axisValues) {
        this.force.set(axisValues.throttle,0,0);
        this.rotateY(-axisValues.yaw/100)
    }

    public integrate(dt = 1/60) {
        const acceleration = this.force.clone().divideScalar(this.mass);

        this.velocity.add(acceleration.multiplyScalar(dt));

        this.position.add(this.velocity.clone().multiplyScalar(dt).applyQuaternion(this.quaternion));
        
        //Reset forces acting on object
        this.force.set(0,0,0);
    }
}
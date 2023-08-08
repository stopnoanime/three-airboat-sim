import { Airboat } from './Airboat';
import * as THREE from 'three';
import * as PLANCK from 'planck';
import { assertVec3 } from '../testHelpers';

describe('Airboat', () => {
  let world: PLANCK.World;
  let airboat: Airboat;

  beforeEach(() => {
    world = new PLANCK.World();
    airboat = new Airboat(world);
  });

  it('should be created', () => {
    expect(airboat).toBeTruthy();
  });

  it('outputs correct speed', () => {
    airboat.body.setLinearVelocity(PLANCK.Vec2(10, 10));
    expect(airboat.speed).toBeCloseTo(10 * Math.sqrt(2));
  });

  it('positions camera around airboat', () => {
    const baseDis = airboat.settings.baseCameraDistance;
    const vertScale = airboat.settings.cameraDistanceVerticalScale;
    const velScale = airboat.settings.cameraDistanceVelocityScale;
    const camera = new THREE.PerspectiveCamera();

    //static
    airboat.updateCamera(camera, 0);
    assertVec3(camera.position, -baseDis, baseDis * vertScale, 0);

    //moving
    airboat.body.setLinearVelocity(new PLANCK.Vec2(10, 0));
    airboat.updateCamera(camera, 0);
    assertVec3(
      camera.position,
      -baseDis * 10 * velScale,
      baseDis * vertScale * 10 * velScale,
      0,
    );

    //angled
    airboat.body.setLinearVelocity(new PLANCK.Vec2(0, 0));
    airboat.rotateY(Math.PI / 2);
    airboat.updateCamera(camera, Math.PI);
    assertVec3(camera.position, 0, baseDis * vertScale, -baseDis);
  });

  it('applies forces', () => {
    const thrust = airboat.settings.thrust;
    const turning = airboat.settings.thrustTurningTorque;

    airboat.calculateForces({ yaw: -1, throttle: 1 });
    world.step(0.1);

    expect(airboat.body.getLinearVelocity().x).toBeCloseTo(thrust * 0.1);
    expect(airboat.body.getAngularVelocity()).toBeCloseTo(turning * 0.1);
  });

  it('applies drag', () => {
    const drag = airboat.settings.frontalDrag;
    const turning = airboat.settings.turningFriction;

    airboat.body.setAngularVelocity(1);
    airboat.body.setLinearVelocity(PLANCK.Vec2(1, 0));

    airboat.calculateForces({ yaw: 0, throttle: 0 });
    world.step(0.1);

    expect(airboat.body.getLinearVelocity().x).toBeCloseTo(1 - 0.1 * drag);
    expect(airboat.body.getAngularVelocity()).toBeCloseTo(1 - 0.1 * turning);
  });

  it('applies stronger sideways drag', () => {
    const sideDrag = airboat.settings.sidewaysDrag;

    //make airboat swim sideways
    airboat.body.setAngle(Math.PI / 2);
    airboat.body.setLinearVelocity(PLANCK.Vec2(1, 0));

    airboat.calculateForces({ yaw: 0, throttle: 0 });
    world.step(0.1);

    expect(airboat.body.getLinearVelocity().x).toBeCloseTo(1 - 0.1 * sideDrag);
  });

  it('synchronizes body and mesh', () => {
    airboat.body.setAngle(Math.PI / 2);
    airboat.body.setPosition(PLANCK.Vec2(-10, 20));
    airboat.body.setLinearVelocity(PLANCK.Vec2(10, 0));

    airboat.syncBodyAndMesh();

    assertVec3(airboat.position, -10, 0, -20);
    expect(airboat.rotation.y).toBe(Math.PI / 2);

    //it also should pass data to shader
    expect(airboat.foamMaterial.uniforms['vel'].value).toBe(10);
    expect(airboat.foamMaterial.uniforms['velAngle'].value).toBeCloseTo(
      -Math.PI / 2,
    );
  });

  it('resets', () => {
    airboat.body.setAngle(1);
    airboat.body.setPosition(PLANCK.Vec2(1, 1));
    airboat.body.setLinearVelocity(PLANCK.Vec2(1, 1));
    airboat.body.setAngularVelocity(1);

    airboat.reset();

    expect(airboat.body.getAngle()).toBe(0);
    expect(airboat.body.getPosition()).toEqual(PLANCK.Vec2(0, 0));
    expect(airboat.body.getLinearVelocity()).toEqual(PLANCK.Vec2(0, 0));
    expect(airboat.body.getAngularVelocity()).toBe(0);
  });

  it('updates shader time', () => {
    airboat.updateTime(5);

    expect(airboat.wakeMaterial.uniforms['time'].value).toBe(5);
    expect(airboat.foamMaterial.uniforms['time'].value).toBe(5);
  });

  it('updates control surface look', () => {
    airboat.updateControlSurfaces({
      throttle: 0.4,
      yaw: 1,
    });

    expect(airboat.propeller.rotation.x).toBeCloseTo(0.4);
    expect(airboat.rudder.rotation.y).toBeCloseTo(Math.PI / 4);
    expect(airboat.wakeMaterial.uniforms['throttle'].value).toBeCloseTo(0.4);
  });
});

import { keyEvent } from '../testHelpers';
import { InputController } from './InputController';

describe('InputController', () => {
  let inputController: InputController;
  const changeRate = 2.5; // u/s

  beforeEach(() => {
    inputController = new InputController();
  });

  it('should be created', () => {
    expect(inputController).toBeTruthy();
    expect(inputController.axisValues.yaw).toBe(0);
    expect(inputController.axisValues.throttle).toBe(0);
  });

  it('should ignore not mapped keys', () => {
    expect(() => inputController.onKeyEvent(keyEvent('key'))).not.toThrow();
  });

  it('should change throttle on keypress', () => {
    // W
    inputController.onKeyEvent(keyEvent('KeyW'));
    inputController.stepAxisValues(0.1);
    expect(inputController.axisValues.throttle).toBe(0.25);

    // W and S
    inputController.onKeyEvent(keyEvent('KeyS'));
    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(0);

    // S
    inputController.onKeyEvent(keyEvent('KeyW', 'keyup'));
    inputController.stepAxisValues(0.1);
    expect(inputController.axisValues.throttle).toBe(-0.25);

    // None
    inputController.onKeyEvent(keyEvent('KeyS', 'keyup'));
    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(0);
  });

  it('should change yaw on keypress', () => {
    // D
    inputController.onKeyEvent(keyEvent('KeyD'));
    inputController.stepAxisValues(0.2);
    expect(inputController.axisValues.yaw).toBe(0.5);

    // D and A
    inputController.onKeyEvent(keyEvent('KeyA'));
    inputController.stepAxisValues(1);
    expect(inputController.axisValues.yaw).toBe(0);

    // A
    inputController.onKeyEvent(keyEvent('KeyD', 'keyup'));
    inputController.stepAxisValues(0.2);
    expect(inputController.axisValues.yaw).toBe(-0.5);

    // None
    inputController.onKeyEvent(keyEvent('KeyA', 'keyup'));
    inputController.stepAxisValues(1);
    expect(inputController.axisValues.yaw).toBe(0);
  });

  it('should limit yaw and throttle values', () => {
    inputController.onKeyEvent(keyEvent('KeyD'));
    inputController.onKeyEvent(keyEvent('KeyW'));

    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(1);
    expect(inputController.axisValues.yaw).toBe(1);

    inputController.onKeyEvent(keyEvent('KeyD', 'keyup'));
    inputController.onKeyEvent(keyEvent('KeyW', 'keyup'));
    inputController.onKeyEvent(keyEvent('KeyS'));
    inputController.onKeyEvent(keyEvent('KeyA'));

    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(-0.5);
    expect(inputController.axisValues.yaw).toBe(-1);
  });

  it('should output camera angle based on keypress', () => {
    expect(inputController.getCameraDirection()).toBe(0);

    inputController.onKeyEvent(keyEvent('ArrowRight'));
    expect(inputController.getCameraDirection()).toBe(Math.PI / 2);

    inputController.onKeyEvent(keyEvent('ArrowUp'));
    expect(inputController.getCameraDirection()).toBe((Math.PI * 3) / 4);

    inputController.onKeyEvent(keyEvent('ArrowLeft'));
    expect(inputController.getCameraDirection()).toBe(Math.PI);
  });

  it('should reset keys on blur', () => {
    inputController.onKeyEvent(keyEvent('KeyW'));
    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(1);

    inputController.onBlur();

    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(0);
  });

  it('should have working throttle override', () => {
    inputController.throttleOverride = true;
    inputController.axisValues.throttle = 2;

    inputController.stepAxisValues(1);
    expect(inputController.axisValues.throttle).toBe(1);
  });

  it('should have working yaw override', () => {
    inputController.yawOverride = true;
    inputController.axisValues.yaw = -0.5;

    inputController.stepAxisValues(1);
    expect(inputController.axisValues.yaw).toBe(-0.5);
  });

  it('should have working camera override', () => {
    inputController.cameraOverride = true;
    inputController.cameraOverrideAngle = 1;

    expect(inputController.getCameraDirection()).toBe(1);
  });
});

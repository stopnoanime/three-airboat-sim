export class InputController {
  public throttleOverride = false;
  public yawOverride = false;
  public cameraOverride = false;
  public cameraOverrideAngle = 0;

  public keyMap = {
    KeyW: 'throttleUp',
    KeyS: 'throttleDown',
    KeyA: 'yawLeft',
    KeyD: 'yawRight',
    ArrowRight: 'lookRight',
    ArrowLeft: 'lookLeft',
    ArrowDown: 'lookBack',
    ArrowUp: 'lookFront',
  };

  public axisValues: axisValues = {
    yaw: 0,
    throttle: 0,
  };

  private keyState = {
    throttleUp: false,
    throttleDown: false,
    yawLeft: false,
    yawRight: false,
    lookRight: false,
    lookLeft: false,
    lookBack: false,
    lookFront: false,
  };

  public onKeyEvent(event: KeyboardEvent) {
    if (!this.keyMap[event.code as keyof typeof this.keyMap]) return;

    // lol
    this.keyState[
      this.keyMap[
        event.code as keyof typeof this.keyMap
      ] as keyof typeof this.keyState
    ] = event.type == 'keydown';
  }

  public stepAxisValues(dt: number) {
    if (!this.throttleOverride)
      this.axisValues.throttle = this.stepSingleAxis(
        this.keyState.throttleDown,
        this.keyState.throttleUp,
        this.axisValues.throttle,
        dt,
      );

    if (!this.yawOverride)
      this.axisValues.yaw = this.stepSingleAxis(
        this.keyState.yawLeft,
        this.keyState.yawRight,
        this.axisValues.yaw,
        dt,
      );

    this.axisValues.throttle = this.minMaxAndRound(
      this.axisValues.throttle,
      -0.5,
      1,
    );
    this.axisValues.yaw = this.minMaxAndRound(this.axisValues.yaw, -1, 1);

    return this.axisValues;
  }

  public getCameraDirection(): number {
    if (this.cameraOverride) return this.cameraOverrideAngle;

    // Couldn't figure out a better way to do it
    if (this.keyState.lookFront && this.keyState.lookLeft) return -Math.PI / 4;
    if (this.keyState.lookFront && this.keyState.lookRight) return Math.PI / 4;
    if (this.keyState.lookFront) return 0;

    if (this.keyState.lookBack && this.keyState.lookLeft)
      return (-Math.PI * 3) / 4;
    if (this.keyState.lookBack && this.keyState.lookRight)
      return (Math.PI * 3) / 4;
    if (this.keyState.lookBack) return Math.PI;

    if (this.keyState.lookLeft) return (Math.PI * 3) / 2;
    if (this.keyState.lookRight) return Math.PI / 2;

    return 0;
  }

  private stepSingleAxis(
    keyDown: boolean,
    keyUp: boolean,
    value: number,
    dt: number,
  ) {
    const speed = dt * 2.5;

    if (keyUp != keyDown) {
      value += speed * (keyUp ? 1 : -1);
    } else if (value != 0) {
      // Move value back to 0 if no keys are pressed (or both are pressed at the same time)
      if (Math.abs(value) <= speed) value = 0;
      else value += value > 0 ? -speed : +speed;
    }

    return value;
  }

  private minMaxAndRound(val: number, min: number, max: number) {
    return Math.round(Math.min(Math.max(val, min), max) * 100) / 100;
  }
}

export type axisValues = {
  yaw: number;
  throttle: number;
};

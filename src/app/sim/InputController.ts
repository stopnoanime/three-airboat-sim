/**
 * Takes keyboard and touch inputs and outputs
 * throttle, yaw and camera angle values.
 */
export class InputController {
  /** When true, throttle keyboard input is ignored. */
  public throttleOverride = false;

  /** When true, yaw keyboard input is ignored. */
  public yawOverride = false;

  /** When true, camera keyboard input is ignored. */
  public cameraOverride = false;
  /** Camera angle to output when cameraOverride is set. */
  public cameraOverrideAngle = 0;

  /** Maps keyboardEvent key codes to their function. */
  public keyMap: Record<string, keyof typeof this.keyState> = {
    KeyW: 'throttleUp',
    KeyS: 'throttleDown',
    KeyA: 'yawLeft',
    KeyD: 'yawRight',
    ArrowRight: 'lookRight',
    ArrowLeft: 'lookLeft',
    ArrowDown: 'lookBack',
    ArrowUp: 'lookFront',
  };

  /**
   * Yaw and throttle values.
   * They are usually set automatically by the InputController,
   * but when `throttleOverride` or `yawOverride` is set,
   * you can set them and they won't be changed
   */
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

  /**
   * KeyboardEvent handler
   * @param event The keyboard event
   */
  public onKeyEvent(event: KeyboardEvent) {
    const mappedKey = this.keyMap[event.code as keyof typeof this.keyMap];

    if (!mappedKey) return;

    this.keyState[mappedKey] = event.type == 'keydown';
  }

  /**
   * Blur event handler, used to reset all key values when page loses focus (it doesn't receive keydown events then)
   */
  public onBlur() {
    Object.keys(this.keyState).forEach(
      (v) => (this.keyState[v as keyof typeof this.keyState] = false),
    );
  }

  /**
   * Calculates new axis values based on key states and change in time
   * @param dt Delta time
   * @returns The new axis values
   */
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

    this.axisValues.throttle = this.clampAndRound(
      this.axisValues.throttle,
      -0.5,
      1,
    );
    this.axisValues.yaw = this.clampAndRound(this.axisValues.yaw, -1, 1);

    return this.axisValues;
  }

  /**
   * Calculates camera angle based on key state
   * @returns Camera angle in (-π, +π] range
   */
  public getCameraDirection(): number {
    if (this.cameraOverride) return this.cameraOverrideAngle;

    let x = 0,
      y = 0;

    if (this.keyState.lookRight) y++;
    if (this.keyState.lookLeft) y--;

    if (this.keyState.lookBack) x++;
    if (this.keyState.lookFront) x--;

    return Math.atan2(y, x);
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

  private clampAndRound(val: number, min: number, max: number) {
    return Math.round(Math.min(Math.max(val, min), max) * 100) / 100;
  }
}

export type axisValues = {
  yaw: number;
  throttle: number;
};

export class KeyboardController {

    public keyMap = {
        KeyW: 'throttleUp',
        KeyS: 'throttleDown',
        KeyA: 'yawLeft',
        KeyD: 'yawRight',
    }

    public axisValues: axisValues = {
        yaw: 0,
        throttle: 0,
    }

    private keyState = {
        throttleUp: false,
        throttleDown: false,
        yawLeft: false,
        yawRight: false,
    }

    public onKeyEvent(event: KeyboardEvent) {
        if(!this.keyMap[event.code as keyof typeof this.keyMap]) return
        
        // lol
        this.keyState[this.keyMap[event.code as keyof typeof this.keyMap] as keyof typeof this.keyState] = event.type == 'keydown';
    }

    public stepAxisValues() {
        this.axisValues.throttle = this.stepSingleAxis(this.keyState.throttleDown, this.keyState.throttleUp, this.axisValues.throttle)
        this.axisValues.yaw = this.stepSingleAxis(this.keyState.yawLeft, this.keyState.yawRight, this.axisValues.yaw)

        this.axisValues.throttle = this.minMaxAndRound(this.axisValues.throttle, -0.5, 1)
        this.axisValues.yaw = this.minMaxAndRound(this.axisValues.yaw, -1, 1)

        return this.axisValues
    }

    private stepSingleAxis(keyDown: boolean, keyUp: boolean, value: number) {
        if(keyUp != keyDown) {
            value += 0.02 * (keyUp ? 1 : -1)
        } else if(value != 0) { // Move value back to 0 if no keys are pressed (or both are pressed at the same time)
            value += value > 0 ? -0.02 : + 0.02;
        }

        return value
    }

    private minMaxAndRound(val: number, min: number, max: number) {
        return Math.round(Math.min(Math.max(val, min), max) * 100) / 100 
    }
}

export type axisValues = {
    yaw: number,
    throttle: number,
}

export class KeyboardController {

    public keyMap = {
        w: 'throttleUp',
        s: 'throttleDown',
        a: 'yawLeft',
        d: 'yawRight',
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
        if(!this.keyMap[event.key as keyof typeof this.keyMap]) return
        
        // lol
        this.keyState[this.keyMap[event.key as keyof typeof this.keyMap] as keyof typeof this.keyState] = event.type == 'keydown';
    }

    public stepAxisValues() {
        //Throttle
        if(this.keyState.throttleUp != this.keyState.throttleDown) {
            this.axisValues.throttle += 0.02 * (this.keyState.throttleUp ? 1 : -1)
        }

        //Yaw
        if(this.keyState.yawLeft != this.keyState.yawRight) {
            this.axisValues.yaw += 0.02 * (this.keyState.yawRight ? 1 : -1)
        } else if(this.axisValues.yaw != 0) { // Move yaw back to 0 if no keys are pressed (or both are pressed at the same time)
            this.axisValues.yaw += this.axisValues.yaw > 0 ? -0.02 : + 0.02;
        }

        this.axisValues.throttle = this.minMaxAndRound(this.axisValues.throttle, -0.5, 1)
        this.axisValues.yaw = this.minMaxAndRound(this.axisValues.yaw, -1, 1)

        return this.axisValues
    }

    private minMaxAndRound(val: number, min: number, max: number) {
        return Math.round(Math.min(Math.max(val, min), max) * 100) / 100 
    }
}

export type axisValues = {
    yaw: number,
    throttle: number,
}

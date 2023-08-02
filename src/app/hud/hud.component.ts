import { Component } from '@angular/core';
import { SimService } from '../sim/sim.service';

@Component({
  selector: 'app-hud',
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.scss'],
})
export class HudComponent {
  get throttle() {
    return this.sim.keyboardController.axisValues.throttle;
  }

  get yaw() {
    return this.sim.keyboardController.axisValues.yaw;
  }

  get speed() {
    return this.sim.airboat.speed;
  }

  constructor(public sim: SimService) {}

  throttleMove(ratio: number) {
    this.sim.keyboardController.throttleOverride = true;
    this.sim.keyboardController.axisValues.throttle = (1 - ratio) * 1.5 - 0.5;
  }

  yawMove(ratio: number) {
    this.sim.keyboardController.yawOverride = true;
    this.sim.keyboardController.axisValues.yaw = ratio * 2 - 1;
  }

  cameraMove(angle: number) {
    this.sim.keyboardController.cameraOverride = true;
    this.sim.keyboardController.cameraOverrideAngle = angle;
  }
}

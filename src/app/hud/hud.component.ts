import { Component } from '@angular/core';
import { SimService } from '../sim/sim.service';

@Component({
  selector: 'app-hud',
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.scss'],
})
export class HudComponent {
  get throttle() {
    return this.sim.inputController.axisValues.throttle;
  }

  get yaw() {
    return this.sim.inputController.axisValues.yaw;
  }

  get speed() {
    return this.sim.airboat.speed;
  }

  constructor(public sim: SimService) {}

  throttleMove(ratio: number) {
    this.sim.inputController.throttleOverride = true;
    this.sim.inputController.axisValues.throttle = (1 - ratio) * 1.5 - 0.5;
  }

  yawMove(ratio: number) {
    this.sim.inputController.yawOverride = true;
    this.sim.inputController.axisValues.yaw = ratio * 2 - 1;
  }

  cameraMove(angle: number) {
    this.sim.inputController.cameraOverride = true;
    this.sim.inputController.cameraOverrideAngle = angle;
  }
}

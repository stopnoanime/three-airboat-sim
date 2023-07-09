import { Component, Input } from '@angular/core';
import { axisValues } from '../sim/KeyboardController';

@Component({
  selector: 'app-hud',
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.scss']
})
export class HudComponent {
  @Input() axisValues!: axisValues;
  @Input() velocity!: number;
}

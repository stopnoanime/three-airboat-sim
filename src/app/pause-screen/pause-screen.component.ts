import { Component, HostBinding } from '@angular/core';
import { SimService } from '../sim/sim.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-pause-screen',
  templateUrl: './pause-screen.component.html',
  styleUrls: ['./pause-screen.component.scss'],
  animations: [
    trigger(
      'leaveAnimation', [
        transition(':leave', [
          animate('200ms', style({ opacity: 0}))
        ])
      ]
    )
  ],
})
export class PauseScreenComponent {
  constructor(public sim: SimService) {};

  @HostBinding('@leaveAnimation') leaveAnimation = true;
}

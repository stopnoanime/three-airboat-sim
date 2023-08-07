import { animate, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Input } from '@angular/core';
import { SimService } from '../sim/sim.service';

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss'],
  animations: [
    trigger('leaveAnimation', [
      transition(':leave', [animate('500ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class LoadingScreenComponent {
  @HostBinding('@leaveAnimation') leaveAnimation = true;

  constructor(public sim: SimService) {}
}

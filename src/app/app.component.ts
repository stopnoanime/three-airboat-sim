import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { SimService } from './sim/sim.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  constructor(public sim: SimService) {}

  ngOnInit(): void {
    this.sim.initialize(this.canvas.nativeElement);
  }

  @HostListener('window:resize')
  onResize() {
    this.sim.onResize();
  }

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  onKey(event: KeyboardEvent) {
    if (this.sim.playing && event.code == 'KeyR' && event.type == 'keydown')
      this.sim.reset();
    else if (
      this.sim.playing &&
      event.code == 'Escape' &&
      event.type == 'keydown'
    )
      this.sim.stop();
    else if (
      !this.sim.playing &&
      event.code == 'Escape' &&
      event.type == 'keydown'
    )
      this.sim.start();
    else this.sim.keyboardController.onKeyEvent(event);
  }

  @HostListener('window:blur')
  onBlur() {
    this.sim.stopMusic();
    this.sim.keyboardController.onBlur();
  }

  @HostListener('window:focus')
  onFocus() {
    this.sim.startMusic();
  }
}

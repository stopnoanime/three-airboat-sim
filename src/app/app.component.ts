import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { SimService } from './sim/sim.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  @ViewChild("canvas", {static:true})
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
    if(event.key == 'r' && event.type == 'keydown') this.sim.reset()
    else this.sim.onKeyEvent(event);
  }
}
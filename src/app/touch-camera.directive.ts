import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appTouchCamera]',
})
export class TouchCameraDirective {
  @Output() cameraMove = new EventEmitter<number>();
  @Output() cameraEnd = new EventEmitter();

  private nativeElement: Element;

  private touchId?: number;
  private startX = 0;
  private startY = 0;

  constructor(private el: ElementRef) {
    this.nativeElement = el.nativeElement;
  }

  @HostListener('touchstart', ['$event'])
  touchStart(event: TouchEvent) {
    if (this.touchId != undefined || event.target != this.nativeElement) return;
    const touch = event.changedTouches[0];

    this.touchId = touch.identifier;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
  }

  @HostListener('touchmove', ['$event'])
  touchMove(event: TouchEvent) {
    const touch = this.getTrackedTouch(event);
    if (!touch) return;

    if (event.cancelable) event.preventDefault();

    const offsetX = touch.clientX - this.startX;
    const offsetY = touch.clientY - this.startY;

    const dis = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (dis < 25) {
      this.cameraEnd.emit();
      return;
    }

    const step = Math.PI / 4;
    const angle = Math.round(Math.atan2(offsetX, offsetY) / step) * step;
    this.cameraMove.emit(angle);
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  touchEnd(event: TouchEvent) {
    const touch = this.getTrackedTouch(event);
    if (!touch) return;

    this.touchId = undefined;
    this.cameraEnd.emit();
  }

  private getTrackedTouch(event: TouchEvent) {
    return [...event.changedTouches].find((t) => t.identifier == this.touchId);
  }
}

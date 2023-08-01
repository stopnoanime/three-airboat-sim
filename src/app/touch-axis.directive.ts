import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appTouchAxis]',
})
export class TouchAxisDirective {
  @Input() appTouchAxis: 'y' | 'x' = 'y';

  @Output() axisMove = new EventEmitter<number>();
  @Output() axisEnd = new EventEmitter();

  private nativeElement: Element;

  constructor(private el: ElementRef) {
    this.nativeElement = el.nativeElement;
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchmove', ['$event'])
  touchStart(event: TouchEvent) {
    const filteredTouches = [...event.touches].filter((t) =>
      this.nativeElement.contains(t.target as Element),
    );
    if (filteredTouches.length != 1) return;

    const touch = filteredTouches[0];
    const bb = this.nativeElement.getBoundingClientRect();

    const ratio =
      this.appTouchAxis == 'y'
        ? (touch.pageY - bb.y) / bb.height
        : (touch.pageX - bb.x) / bb.width;

    this.axisMove.emit(Math.min(Math.max(ratio, 0), 1));
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  touchEnd(event: TouchEvent) {
    this.axisEnd.emit();
  }
}

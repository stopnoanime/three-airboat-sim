import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

/**
 * Directive that adds slider touch controls to an element.
 *
 * Inputs:
 * - appTouchAxis - 'x' or 'y' - specifies the axis direction, x for horizontal, y for vertical
 *
 * Outputs:
 * - axisMove - emits number in [0, 1] range corresponding to relative touch position in element in axis direction
 * - axisEnd - emits on touch end
 */
@Directive({
  selector: '[appTouchAxis]',
})
export class TouchAxisDirective {
  @Input() appTouchAxis: 'y' | 'x' = 'y';

  @Output() axisMove = new EventEmitter<number>();
  @Output() axisEnd = new EventEmitter();

  private nativeElement: Element;

  private touchId?: number;

  constructor(private el: ElementRef) {
    this.nativeElement = el.nativeElement;
  }

  @HostListener('touchstart', ['$event'])
  touchStart(event: TouchEvent) {
    event.stopPropagation();

    if (this.touchId != undefined) return;

    this.touchId = event.changedTouches[0].identifier;

    this.calculateAxis(event);
  }

  @HostListener('touchmove', ['$event'])
  touchMove(event: TouchEvent) {
    event.stopPropagation();

    if (event.cancelable) event.preventDefault();

    this.calculateAxis(event);
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  touchEnd(event: TouchEvent) {
    event.stopPropagation();

    const touch = this.getTrackedTouch(event);
    if (!touch) return;

    this.touchId = undefined;
    this.axisEnd.emit();
  }

  @HostListener('window:blur')
  onBlur() {
    this.touchId = undefined;
    this.axisEnd.emit();
  }

  private calculateAxis(event: TouchEvent) {
    const touch = this.getTrackedTouch(event);
    if (!touch) return;

    const bb = this.nativeElement.getBoundingClientRect();

    const ratio =
      this.appTouchAxis == 'y'
        ? (touch.pageY - bb.y) / bb.height
        : (touch.pageX - bb.x) / bb.width;

    this.axisMove.emit(Math.min(Math.max(ratio, 0), 1));
  }

  private getTrackedTouch(event: TouchEvent) {
    return [...event.changedTouches].find((t) => t.identifier == this.touchId);
  }
}

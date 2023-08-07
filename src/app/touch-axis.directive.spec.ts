import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TouchAxisDirective } from './touch-axis.directive';
import { By } from '@angular/platform-browser';
import { dispatchTouchEvent } from './testHelpers';

@Component({
  template: `
    <div
      style="width: 100px; height: 100px; left: 0px; top: 0px; position: absolute"
      [appTouchAxis]="axis"
      (axisMove)="axisMove = $event"
      (axisEnd)="axisEnd = true"
    ></div>
  `,
})
class TouchAxisDirectiveComponent {
  axis = 'x';
  axisMove?: number;
  axisEnd = false;
}

describe('TouchAxisDirective', () => {
  let component: TouchAxisDirectiveComponent;
  let fixture: ComponentFixture<TouchAxisDirectiveComponent>;
  let div: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TouchAxisDirectiveComponent, TouchAxisDirective],
    });
    fixture = TestBed.createComponent(TouchAxisDirectiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    div = fixture.debugElement.query(By.css('div')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(div).toBeTruthy();
  });

  it('should emit axisMove events for x axis', () => {
    expect(component.axis).toBe('x');

    dispatchTouchEvent(div, 'touchstart', 0, 0);
    expect(component.axisMove).toBe(0);

    dispatchTouchEvent(div, 'touchmove', 50, 0);
    expect(component.axisMove).toBe(0.5);

    dispatchTouchEvent(div, 'touchmove', 100, 0);
    expect(component.axisMove).toBe(1);
  });

  it('should emit axisMove events for y axis', () => {
    component.axis = 'y';
    fixture.detectChanges();

    dispatchTouchEvent(div, 'touchstart', 0, 50);
    expect(component.axisMove).toBe(0.5);
  });

  it('should emit axisEnd event', () => {
    dispatchTouchEvent(div, 'touchstart', 0, 0);
    dispatchTouchEvent(div, 'touchend', 0, 0);

    expect(component.axisEnd).toBeTrue();
  });

  it('should ignore events from different touches', () => {
    dispatchTouchEvent(div, 'touchstart', 0, 0, 0);

    dispatchTouchEvent(div, 'touchstart', 50, 0, 1);
    dispatchTouchEvent(div, 'touchmove', 50, 0, 1);
    dispatchTouchEvent(div, 'touchend', 50, 0, 1);

    expect(component.axisMove).toBe(0);
    expect(component.axisEnd).toBeFalse();
  });
});

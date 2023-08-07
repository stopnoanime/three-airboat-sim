import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TouchCameraDirective } from './touch-camera.directive';
import { By } from '@angular/platform-browser';
import { dispatchTouchEvent } from './testHelpers';

@Component({
  template: `
    <div
      style="width: 100px; height: 100px; left: 0px; top: 0px; position: absolute"
      appTouchCamera
      (cameraMove)="cameraMove = $event"
      (cameraEnd)="cameraEnd = true"
    ></div>
  `,
})
class TouchCameraDirectiveComponent {
  cameraMove?: number;
  cameraEnd = false;
}

describe('TouchCameraDirective', () => {
  let component: TouchCameraDirectiveComponent;
  let fixture: ComponentFixture<TouchCameraDirectiveComponent>;
  let div: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TouchCameraDirectiveComponent, TouchCameraDirective],
    });
    fixture = TestBed.createComponent(TouchCameraDirectiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    div = fixture.debugElement.query(By.css('div')).nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(div).toBeTruthy();
  });

  it('should emit cameraMove events', () => {
    dispatchTouchEvent(div, 'touchstart', 50, 50);

    const assertAngle = (x: number, y: number, angle: number) => {
      dispatchTouchEvent(div, 'touchmove', x, y);
      expect(component.cameraMove).toBe(angle);
    };

    assertAngle(50, 100, 0);
    assertAngle(100, 100, Math.PI / 4);
    assertAngle(100, 50, Math.PI / 2);
    assertAngle(100, 0, (Math.PI * 3) / 4);
    assertAngle(50, 0, Math.PI);
    assertAngle(0, 0, (-Math.PI * 3) / 4);
    assertAngle(0, 50, -Math.PI / 2);
    assertAngle(0, 100, -Math.PI / 4);
  });

  it('should emit cameraEnd event', () => {
    dispatchTouchEvent(div, 'touchstart', 0, 0);
    dispatchTouchEvent(div, 'touchend', 0, 0);

    expect(component.cameraEnd).toBeTrue();
  });

  it('should ignore events from different touches', () => {
    dispatchTouchEvent(div, 'touchstart', 50, 50, 0);

    dispatchTouchEvent(div, 'touchstart', 50, 50, 1);
    dispatchTouchEvent(div, 'touchmove', 0, 0, 1);
    dispatchTouchEvent(div, 'touchend', 50, 50, 1);

    expect(component.cameraMove).toBeUndefined();
    expect(component.cameraEnd).toBeFalse();
  });
});

import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export function getEl(fixture: ComponentFixture<any>, selector: string) {
  return fixture.debugElement.query(By.css(selector))?.nativeElement;
}

export function spyPropertyGetter<T, K extends keyof T>(
  spyObj: jasmine.SpyObj<T>,
  propName: K,
): jasmine.Spy<() => T[K]> {
  return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<
    () => T[K]
  >;
}

export function spyPropertySetter<T, K extends keyof T>(
  spyObj: jasmine.SpyObj<T>,
  propName: keyof T,
) {
  return Object.getOwnPropertyDescriptor(spyObj, propName)?.set as jasmine.Spy<
    (arg: T[K]) => void
  >;
}

export function keyEvent(code: string, type: 'keydown' | 'keyup' = 'keydown') {
  return new KeyboardEvent(type, { code: code });
}

export function windowKeyEvent(key: string) {
  const event = keyEvent(key);
  window.dispatchEvent(event);
  return event;
}

export function dispatchTouchEvent(
  el: HTMLElement,
  type: string,
  x: number,
  y: number,
  id = 0,
) {
  el.dispatchEvent(
    new TouchEvent(type, {
      changedTouches: [
        new Touch({
          pageX: x,
          pageY: y,
          clientX: x,
          clientY: y,
          identifier: id,
          target: el,
        }),
      ],
    }),
  );
}

export function assertVec3(
  vec3: THREE.Vector3,
  x: number,
  y: number,
  z: number,
) {
  expect(vec3.x).toBeCloseTo(x);
  expect(vec3.y).toBeCloseTo(y);
  expect(vec3.z).toBeCloseTo(z);
}

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

export function windowKeyEvent(key: string) {
  const event = new KeyboardEvent('keydown', { code: key });
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
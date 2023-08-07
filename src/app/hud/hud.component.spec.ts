import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimService } from '../sim/sim.service';
import { By } from '@angular/platform-browser';
import { HudComponent } from './hud.component';
import { InputController } from '../sim/InputController';
import { Airboat } from '../sim/Airboat';
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { spyPropertyGetter, spyPropertySetter, getEl } from '../testHelpers';

@Directive({
  selector: '[appTouchCamera]',
})
export class MockTouchCameraDirective {
  @Output() cameraMove = new EventEmitter<number>();
  @Output() cameraEnd = new EventEmitter();
}

@Directive({
  selector: '[appTouchAxis]',
})
export class MockTouchAxisDirective {
  @Input() appTouchAxis: 'y' | 'x' = 'y';

  @Output() axisMove = new EventEmitter<number>();
  @Output() axisEnd = new EventEmitter();
}

describe('HudComponent', () => {
  let component: HudComponent;
  let fixture: ComponentFixture<HudComponent>;
  let mockSimService: jasmine.SpyObj<SimService>;
  let mockInputController: jasmine.SpyObj<InputController>;

  beforeEach(() => {
    mockInputController = jasmine.createSpyObj<InputController>(
      'InputController',
      [],
      {
        throttleOverride: false,
        yawOverride: false,
        cameraOverride: false,
        cameraOverrideAngle: 0,
        axisValues: {
          yaw: 0,
          throttle: 0,
        },
      },
    );

    mockSimService = jasmine.createSpyObj<SimService>('SimService', ['stop'], {
      inputController: mockInputController,
      airboat: jasmine.createSpyObj<Airboat>('Airboat', [], {
        speed: 5,
      }),
    });

    TestBed.configureTestingModule({
      declarations: [
        HudComponent,
        MockTouchCameraDirective,
        MockTouchAxisDirective,
      ],
      providers: [{ provide: SimService, useValue: mockSimService }],
    });

    fixture = TestBed.createComponent(HudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should output airboat speed', () => {
    expect(getEl(fixture, '.speed').textContent).toContain('5.00 m/s');
  });

  it('should output throttle value', () => {
    //Positive throttle
    spyPropertyGetter(mockInputController, 'axisValues').and.returnValue({
      yaw: 0,
      throttle: 0.6,
    });
    fixture.detectChanges();

    expect(getEl(fixture, '[test-id=throttle-pos]').getAttribute('y')).toBe(
      '0.4',
    );
    expect(
      getEl(fixture, '[test-id=throttle-pos]').getAttribute('height'),
    ).toBe('0.6');
    expect(
      getEl(fixture, '[test-id=throttle-neg]').getAttribute('height'),
    ).toBe('0');

    //Negative throttle
    spyPropertyGetter(mockInputController, 'axisValues').and.returnValue({
      yaw: 0,
      throttle: -0.3,
    });
    fixture.detectChanges();

    expect(
      getEl(fixture, '[test-id=throttle-neg]').getAttribute('height'),
    ).toBe('0.3');
    expect(
      getEl(fixture, '[test-id=throttle-pos]').getAttribute('height'),
    ).toBe('0');
  });

  it('should output yaw value', () => {
    spyPropertyGetter(mockInputController, 'axisValues').and.returnValue({
      yaw: 0.8,
      throttle: 0,
    });
    fixture.detectChanges();

    expect(getEl(fixture, '.yaw > rect').getAttribute('x')).toBe('0.9');

    spyPropertyGetter(mockInputController, 'axisValues').and.returnValue({
      yaw: -1,
      throttle: 0,
    });
    fixture.detectChanges();

    expect(getEl(fixture, '.yaw > rect').getAttribute('x')).toBe('0');
  });

  it('should pause on button click', () => {
    getEl(fixture, '.pause-button').click();
    expect(mockSimService.stop).toHaveBeenCalledTimes(1);
  });

  it('should call inputController on camera events', () => {
    const directive = fixture.debugElement
      .query(By.directive(MockTouchCameraDirective))
      .injector.get(MockTouchCameraDirective);

    directive.cameraMove.emit(1);
    expect(
      spyPropertySetter(mockInputController, 'cameraOverride'),
    ).toHaveBeenCalledOnceWith(true);
    expect(
      spyPropertySetter(mockInputController, 'cameraOverrideAngle'),
    ).toHaveBeenCalledOnceWith(1);

    directive.cameraEnd.emit();
    expect(
      spyPropertySetter(
        mockInputController,
        'cameraOverride',
      ).calls.mostRecent().args,
    ).toEqual([false]);
  });

  it('should call inputController on throttle events', () => {
    const directive = fixture.debugElement
      .query(By.css('.throttle'))
      .injector.get(MockTouchAxisDirective);

    directive.axisMove.emit(0.5);
    expect(
      spyPropertySetter(mockInputController, 'throttleOverride'),
    ).toHaveBeenCalledOnceWith(true);
    expect(mockInputController.axisValues.throttle).toBe(0.25);

    directive.axisEnd.emit();
    expect(
      spyPropertySetter(
        mockInputController,
        'throttleOverride',
      ).calls.mostRecent().args,
    ).toEqual([false]);
  });

  it('should call inputController on yaw events', () => {
    const directive = fixture.debugElement
      .query(By.css('.yaw'))
      .injector.get(MockTouchAxisDirective);

    directive.axisMove.emit(0.75);
    expect(
      spyPropertySetter(mockInputController, 'yawOverride'),
    ).toHaveBeenCalledOnceWith(true);
    expect(mockInputController.axisValues.yaw).toBe(0.5);

    directive.axisEnd.emit();
    expect(
      spyPropertySetter(mockInputController, 'yawOverride').calls.mostRecent()
        .args,
    ).toEqual([false]);
  });
});

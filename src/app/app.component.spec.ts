import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SimService } from './sim/sim.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { InputController } from './sim/InputController';
import { getEl, windowKeyEvent, spyPropertyGetter } from './testHelpers';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockSimService: jasmine.SpyObj<SimService>;

  beforeEach(() => {
    mockSimService = jasmine.createSpyObj<SimService>(
      'SimService',
      [
        'initialize',
        'onResize',
        'reset',
        'stop',
        'start',
        'stopMusic',
        'startMusic',
      ],
      {
        playing: false,
        loaded: false,
        inputController: jasmine.createSpyObj<InputController>(
          'InputController',
          ['onKeyEvent', 'onBlur'],
        ),
      },
    );

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{ provide: SimService, useValue: mockSimService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(getEl(fixture, 'canvas')).toBeTruthy();
  });

  it('should initialize simService', () => {
    expect(mockSimService.initialize).toHaveBeenCalledOnceWith(
      getEl(fixture, 'canvas'),
    );
  });

  it('should show correct components', () => {
    //loading
    expect(getEl(fixture, 'app-loading-screen')).toBeTruthy();
    expect(getEl(fixture, 'app-pause-screen')).toBeFalsy();
    expect(getEl(fixture, 'app-hud')).toBeFalsy();

    //loaded
    spyPropertyGetter(mockSimService, 'loaded').and.returnValue(true);
    fixture.detectChanges();

    expect(getEl(fixture, 'app-loading-screen')).toBeFalsy();
    expect(getEl(fixture, 'app-pause-screen')).toBeTruthy();
    expect(getEl(fixture, 'app-hud')).toBeFalsy();

    //playing
    spyPropertyGetter(mockSimService, 'playing').and.returnValue(true);
    fixture.detectChanges();

    expect(getEl(fixture, 'app-loading-screen')).toBeFalsy();
    expect(getEl(fixture, 'app-pause-screen')).toBeFalsy();
    expect(getEl(fixture, 'app-hud')).toBeTruthy();
  });

  it('should call simService reset on key event', () => {
    windowKeyEvent('KeyR');
    expect(mockSimService.reset).toHaveBeenCalledTimes(0);

    spyPropertyGetter(mockSimService, 'playing').and.returnValue(true);
    windowKeyEvent('KeyR');
    expect(mockSimService.reset).toHaveBeenCalledTimes(1);
  });

  it('should call simService stop on key event', () => {
    windowKeyEvent('Escape');
    expect(mockSimService.stop).toHaveBeenCalledTimes(0);

    spyPropertyGetter(mockSimService, 'playing').and.returnValue(true);
    windowKeyEvent('Escape');
    expect(mockSimService.stop).toHaveBeenCalledTimes(1);
  });

  it('should call simService start on key event', () => {
    windowKeyEvent('Escape');
    expect(mockSimService.start).toHaveBeenCalledTimes(1);
  });

  it('should call inputController onKeyEvent', () => {
    const event = windowKeyEvent('KeyW');
    expect(mockSimService.inputController.onKeyEvent).toHaveBeenCalledOnceWith(
      event,
    );
  });

  it('should call simService on resize', () => {
    window.dispatchEvent(new Event('resize'));
    expect(mockSimService.onResize).toHaveBeenCalledOnceWith();
  });

  it('should call simService on blur', () => {
    window.dispatchEvent(new Event('blur'));

    expect(mockSimService.stopMusic).toHaveBeenCalledOnceWith();
    expect(mockSimService.inputController.onBlur).toHaveBeenCalledOnceWith();
  });

  it('should call simService on focus', () => {
    window.dispatchEvent(new Event('focus'));

    expect(mockSimService.startMusic).toHaveBeenCalledOnceWith();
  });
});

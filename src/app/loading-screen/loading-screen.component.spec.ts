import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimService } from '../sim/sim.service';
import { By } from '@angular/platform-browser';
import { LoadingScreenComponent } from './loading-screen.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { spyPropertyGetter } from '../testHelpers';

describe('LoadingScreenComponent', () => {
  let component: LoadingScreenComponent;
  let fixture: ComponentFixture<LoadingScreenComponent>;
  let mockSimService: jasmine.SpyObj<SimService>;

  beforeEach(() => {
    mockSimService = jasmine.createSpyObj<SimService>('SimService', [], {
      loadingProgress: 0,
    });

    TestBed.configureTestingModule({
      declarations: [LoadingScreenComponent],
      providers: [{ provide: SimService, useValue: mockSimService }],
      imports: [NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(LoadingScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.precentage'))).toBeTruthy();
  });

  it('outputs loading progress', () => {
    expect(
      fixture.debugElement.query(By.css('.precentage')).nativeElement
        .textContent,
    ).toContain('0%');

    spyPropertyGetter(mockSimService, 'loadingProgress').and.returnValue(0.76);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.precentage')).nativeElement
        .textContent,
    ).toContain('76%');
  });
});

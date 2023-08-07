import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimService } from '../sim/sim.service';
import { By } from '@angular/platform-browser';
import { PauseScreenComponent } from './pause-screen.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PauseScreenComponent', () => {
  let component: PauseScreenComponent;
  let fixture: ComponentFixture<PauseScreenComponent>;
  let mockSimService: jasmine.SpyObj<SimService>;

  beforeEach(() => {
    mockSimService = jasmine.createSpyObj<SimService>('SimService', ['start']);

    TestBed.configureTestingModule({
      declarations: [PauseScreenComponent],
      providers: [{ provide: SimService, useValue: mockSimService }],
      imports: [NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(PauseScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css('h1')).nativeElement.textContent,
    ).toContain('Three Airboat Sim');
  });

  it('should start sim on button press', () => {
    const button = fixture.debugElement.query(By.css('button'))
      .nativeElement as HTMLButtonElement;
    button.click();

    expect(mockSimService.start).toHaveBeenCalledTimes(1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrbitLoaderComponent } from './orbit-loader.component';

describe('OrbitLoaderComponent', () => {
  let component: OrbitLoaderComponent;
  let fixture: ComponentFixture<OrbitLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrbitLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrbitLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render optional label and astronomical Gargantua elements by default', () => {
    component.label = 'Sincronizando órbita...';
    component.size = 'lg';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.event-horizon')).toBeTruthy();
    expect(el.querySelector('.accretion-disk')).toBeTruthy();
    expect(el.querySelector('.loader-label')?.textContent).toContain('Sincronizando órbita...');
  });

  it('should render dedicated astronomical variants without duplicating the black hole', () => {
    const el = fixture.nativeElement as HTMLElement;

    component.variant = 'eclipse';
    fixture.detectChanges();
    expect(el.querySelector('.eclipse-skeletons')).toBeTruthy();

    component.variant = 'constellation';
    fixture.detectChanges();
    expect(el.querySelector('.constellation-svg')).toBeTruthy();

    component.variant = 'pulsar';
    fixture.detectChanges();
    expect(el.querySelector('.pulsar-core')).toBeTruthy();

    component.variant = 'astrolabe';
    fixture.detectChanges();
    expect(el.querySelector('.astrolabe-system')).toBeTruthy();

    component.variant = 'comet';
    fixture.detectChanges();
    expect(el.querySelector('.comet-arc')).toBeTruthy();
  });
});

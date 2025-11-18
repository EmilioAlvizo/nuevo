import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselTestimonios } from './carrusel-testimonios';

describe('CarruselTestimonios', () => {
  let component: CarruselTestimonios;
  let fixture: ComponentFixture<CarruselTestimonios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselTestimonios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarruselTestimonios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

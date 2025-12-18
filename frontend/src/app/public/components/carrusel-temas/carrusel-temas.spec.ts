import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselTemas } from './carrusel-temas';

describe('CarruselTemas', () => {
  let component: CarruselTemas;
  let fixture: ComponentFixture<CarruselTemas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselTemas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarruselTemas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

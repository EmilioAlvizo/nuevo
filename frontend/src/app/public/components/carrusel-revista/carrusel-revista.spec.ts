import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselRevista } from './carrusel-revista';

describe('CarruselRevista', () => {
  let component: CarruselRevista;
  let fixture: ComponentFixture<CarruselRevista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselRevista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarruselRevista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

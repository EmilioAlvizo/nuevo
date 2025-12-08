import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Carrusel1 } from './carrusel-1';

describe('Carrusel1', () => {
  let component: Carrusel1;
  let fixture: ComponentFixture<Carrusel1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Carrusel1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Carrusel1);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaActual } from './encuesta-actual';

describe('EncuestaActual', () => {
  let component: EncuestaActual;
  let fixture: ComponentFixture<EncuestaActual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestaActual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaActual);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

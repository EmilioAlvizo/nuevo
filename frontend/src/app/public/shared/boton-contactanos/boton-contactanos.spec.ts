import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonContactanos } from './boton-contactanos';

describe('BotonContactanos', () => {
  let component: BotonContactanos;
  let fixture: ComponentFixture<BotonContactanos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonContactanos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BotonContactanos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

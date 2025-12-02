import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEncuestas } from './form-encuestas';

describe('FormEncuestas', () => {
  let component: FormEncuestas;
  let fixture: ComponentFixture<FormEncuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormEncuestas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormEncuestas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPropuesta } from './form-propuesta';

describe('FormPropuesta', () => {
  let component: FormPropuesta;
  let fixture: ComponentFixture<FormPropuesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPropuesta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPropuesta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

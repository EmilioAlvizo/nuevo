import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTestimonios } from './form-testimonios';

describe('FormTestimonios', () => {
  let component: FormTestimonios;
  let fixture: ComponentFixture<FormTestimonios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTestimonios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTestimonios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

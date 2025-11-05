import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormRevistas } from './form-revistas';

describe('FormRevistas', () => {
  let component: FormRevistas;
  let fixture: ComponentFixture<FormRevistas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormRevistas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormRevistas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

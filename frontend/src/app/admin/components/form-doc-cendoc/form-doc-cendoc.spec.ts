import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDocCendoc } from './form-doc-cendoc';

describe('FormDocCendoc', () => {
  let component: FormDocCendoc;
  let fixture: ComponentFixture<FormDocCendoc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDocCendoc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDocCendoc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

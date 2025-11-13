import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestimoniosAdmin } from './testimonios-admin';

describe('TestimoniosAdmin', () => {
  let component: TestimoniosAdmin;
  let fixture: ComponentFixture<TestimoniosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestimoniosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestimoniosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

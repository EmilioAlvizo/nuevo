import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApoyosServicios } from './apoyos-servicios';

describe('ApoyosServicios', () => {
  let component: ApoyosServicios;
  let fixture: ComponentFixture<ApoyosServicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApoyosServicios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApoyosServicios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

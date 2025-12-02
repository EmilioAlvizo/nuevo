import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApoyosServiciosAdmin } from './apoyos-servicios-admin';

describe('ApoyosServiciosAdmin', () => {
  let component: ApoyosServiciosAdmin;
  let fixture: ComponentFixture<ApoyosServiciosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApoyosServiciosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApoyosServiciosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

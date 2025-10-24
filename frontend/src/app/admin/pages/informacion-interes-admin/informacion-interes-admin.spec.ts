import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionInteresAdmin } from './informacion-interes-admin';

describe('InformacionInteresAdmin', () => {
  let component: InformacionInteresAdmin;
  let fixture: ComponentFixture<InformacionInteresAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformacionInteresAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformacionInteresAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

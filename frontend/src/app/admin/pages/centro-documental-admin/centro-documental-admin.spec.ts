import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroDocumentalAdmin } from './centro-documental-admin';

describe('CentroDocumentalAdmin', () => {
  let component: CentroDocumentalAdmin;
  let fixture: ComponentFixture<CentroDocumentalAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroDocumentalAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroDocumentalAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

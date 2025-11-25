import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivosMunicipiosAdmin } from './archivos-municipios-admin';

describe('ArchivosMunicipiosAdmin', () => {
  let component: ArchivosMunicipiosAdmin;
  let fixture: ComponentFixture<ArchivosMunicipiosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchivosMunicipiosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchivosMunicipiosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

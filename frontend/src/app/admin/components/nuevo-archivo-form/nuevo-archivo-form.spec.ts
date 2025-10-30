import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoArchivoForm } from './nuevo-archivo-form';

describe('NuevoArchivoForm', () => {
  let component: NuevoArchivoForm;
  let fixture: ComponentFixture<NuevoArchivoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoArchivoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevoArchivoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

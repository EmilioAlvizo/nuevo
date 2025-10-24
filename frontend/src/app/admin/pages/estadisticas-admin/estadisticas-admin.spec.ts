import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticasAdmin } from './estadisticas-admin';

describe('EstadisticasAdmin', () => {
  let component: EstadisticasAdmin;
  let fixture: ComponentFixture<EstadisticasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadisticasAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

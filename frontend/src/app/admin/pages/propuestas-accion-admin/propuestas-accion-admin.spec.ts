import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropuestasAccionAdmin } from './propuestas-accion-admin';

describe('PropuestasAccionAdmin', () => {
  let component: PropuestasAccionAdmin;
  let fixture: ComponentFixture<PropuestasAccionAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropuestasAccionAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropuestasAccionAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

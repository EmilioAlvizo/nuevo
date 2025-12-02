import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestasAdmin } from './encuestas-admin';

describe('EncuestasAdmin', () => {
  let component: EncuestasAdmin;
  let fixture: ComponentFixture<EncuestasAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestasAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestasAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SistemaJuventudesAdmin } from './sistema-juventudes-admin';

describe('SistemaJuventudesAdmin', () => {
  let component: SistemaJuventudesAdmin;
  let fixture: ComponentFixture<SistemaJuventudesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SistemaJuventudesAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SistemaJuventudesAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

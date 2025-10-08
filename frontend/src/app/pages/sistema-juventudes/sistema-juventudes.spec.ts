import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SistemaJuventudes } from './sistema-juventudes';

describe('SistemaJuventudes', () => {
  let component: SistemaJuventudes;
  let fixture: ComponentFixture<SistemaJuventudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SistemaJuventudes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SistemaJuventudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDinamica } from './tabla-dinamica';

describe('TablaDinamica', () => {
  let component: TablaDinamica;
  let fixture: ComponentFixture<TablaDinamica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDinamica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDinamica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

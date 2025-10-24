import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevistaDetalle } from './revista-detalle';

describe('RevistaDetalle', () => {
  let component: RevistaDetalle;
  let fixture: ComponentFixture<RevistaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevistaDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevistaDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

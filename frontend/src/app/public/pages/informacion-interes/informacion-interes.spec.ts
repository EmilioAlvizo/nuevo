import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionInteres } from './informacion-interes';

describe('InformacionInteres', () => {
  let component: InformacionInteres;
  let fixture: ComponentFixture<InformacionInteres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformacionInteres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformacionInteres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

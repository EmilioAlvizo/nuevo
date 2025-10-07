import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroDocumental } from './centro-documental';

describe('CentroDocumental', () => {
  let component: CentroDocumental;
  let fixture: ComponentFixture<CentroDocumental>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroDocumental]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroDocumental);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemasInteres } from './temas-interes';

describe('TemasInteres', () => {
  let component: TemasInteres;
  let fixture: ComponentFixture<TemasInteres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemasInteres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemasInteres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

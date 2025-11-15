import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Articulo2 } from './articulo-2';

describe('Articulo2', () => {
  let component: Articulo2;
  let fixture: ComponentFixture<Articulo2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Articulo2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Articulo2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

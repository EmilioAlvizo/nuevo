import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar2 } from './navbar2';

describe('Navbar2', () => {
  let component: Navbar2;
  let fixture: ComponentFixture<Navbar2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Navbar2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

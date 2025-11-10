import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar3 } from './navbar3';

describe('Navbar3', () => {
  let component: Navbar3;
  let fixture: ComponentFixture<Navbar3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar3]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Navbar3);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

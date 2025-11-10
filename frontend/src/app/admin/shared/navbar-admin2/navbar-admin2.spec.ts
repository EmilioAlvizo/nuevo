import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarAdmin2 } from './navbar-admin2';

describe('NavbarAdmin2', () => {
  let component: NavbarAdmin2;
  let fixture: ComponentFixture<NavbarAdmin2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarAdmin2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarAdmin2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

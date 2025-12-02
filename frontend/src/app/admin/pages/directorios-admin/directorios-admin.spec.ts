import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoriosAdmin } from './directorios-admin';

describe('DirectoriosAdmin', () => {
  let component: DirectoriosAdmin;
  let fixture: ComponentFixture<DirectoriosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoriosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectoriosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

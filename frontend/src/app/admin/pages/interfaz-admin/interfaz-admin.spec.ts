import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfazAdmin } from './interfaz-admin';

describe('InterfazAdmin', () => {
  let component: InterfazAdmin;
  let fixture: ComponentFixture<InterfazAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfazAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterfazAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

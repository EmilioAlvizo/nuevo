import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemasInteresAdmin } from './temas-interes-admin';

describe('TemasInteresAdmin', () => {
  let component: TemasInteresAdmin;
  let fixture: ComponentFixture<TemasInteresAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemasInteresAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemasInteresAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

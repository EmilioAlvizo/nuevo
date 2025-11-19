import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BancoDatosAdmin } from './banco-datos-admin';

describe('BancoDatosAdmin', () => {
  let component: BancoDatosAdmin;
  let fixture: ComponentFixture<BancoDatosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BancoDatosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BancoDatosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

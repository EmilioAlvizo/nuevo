import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsejoAdmin } from './consejo-admin';

describe('ConsejoAdmin', () => {
  let component: ConsejoAdmin;
  let fixture: ComponentFixture<ConsejoAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsejoAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsejoAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

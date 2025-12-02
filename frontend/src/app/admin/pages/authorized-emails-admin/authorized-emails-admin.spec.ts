import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizedEmailsAdmin } from './authorized-emails-admin';

describe('AuthorizedEmailsAdmin', () => {
  let component: AuthorizedEmailsAdmin;
  let fixture: ComponentFixture<AuthorizedEmailsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizedEmailsAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorizedEmailsAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

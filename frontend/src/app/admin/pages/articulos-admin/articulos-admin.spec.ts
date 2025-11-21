import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticulosAdmin } from './articulos-admin';

describe('ArticulosAdmin', () => {
  let component: ArticulosAdmin;
  let fixture: ComponentFixture<ArticulosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticulosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArticulosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

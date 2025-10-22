import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarDocumentos } from './navbar-documentos';

describe('NavbarDocumentos', () => {
  let component: NavbarDocumentos;
  let fixture: ComponentFixture<NavbarDocumentos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarDocumentos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarDocumentos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

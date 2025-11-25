import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaArchMunicipios } from './tabla-arch-municipios';

describe('TablaArchMunicipios', () => {
  let component: TablaArchMunicipios;
  let fixture: ComponentFixture<TablaArchMunicipios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaArchMunicipios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaArchMunicipios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

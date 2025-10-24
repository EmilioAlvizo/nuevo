import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaA } from './tabla-a';

describe('TablaA', () => {
  let component: TablaA;
  let fixture: ComponentFixture<TablaA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaA);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

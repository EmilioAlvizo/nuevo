import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaDocCendoc } from './tabla-doc-cendoc';

describe('TablaDocCendoc', () => {
  let component: TablaDocCendoc;
  let fixture: ComponentFixture<TablaDocCendoc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaDocCendoc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaDocCendoc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

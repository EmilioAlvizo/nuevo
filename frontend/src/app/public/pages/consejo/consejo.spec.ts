import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Consejo } from './consejo';

describe('Consejo', () => {
  let component: Consejo;
  let fixture: ComponentFixture<Consejo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Consejo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Consejo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

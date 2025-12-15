import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Flipbook2 } from './flipbook2';

describe('Flipbook2', () => {
  let component: Flipbook2;
  let fixture: ComponentFixture<Flipbook2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Flipbook2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Flipbook2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollProgressBar } from './scroll-progress-bar';

describe('ScrollProgressBar', () => {
  let component: ScrollProgressBar;
  let fixture: ComponentFixture<ScrollProgressBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollProgressBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrollProgressBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

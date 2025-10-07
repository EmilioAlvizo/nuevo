import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevistaVoces } from './revista-voces';

describe('RevistaVoces', () => {
  let component: RevistaVoces;
  let fixture: ComponentFixture<RevistaVoces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevistaVoces]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevistaVoces);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

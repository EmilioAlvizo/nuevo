import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosCendocAdmin } from './documentos-cendoc-admin';

describe('DocumentosCendocAdmin', () => {
  let component: DocumentosCendocAdmin;
  let fixture: ComponentFixture<DocumentosCendocAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosCendocAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosCendocAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

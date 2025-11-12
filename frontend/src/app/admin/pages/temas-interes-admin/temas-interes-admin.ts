import { Component } from '@angular/core';
import { ApiTemas, Temas } from '../../../core/services/temas_interes';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-temas-interes-admin',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './temas-interes-admin.html',
  styleUrl: './temas-interes-admin.css',
})
export class TemasInteresAdmin {
  temas: Temas[] = [];
  formTema: FormGroup;
  editMode: boolean = false;
  selectedTemaId: number | null = null;
  selectedImage: File | null = null;
  modalOpen: boolean = false;

  constructor(private apiTemas: ApiTemas, private fb: FormBuilder) {
    this.formTema = this.fb.group({
      descripcionTema: [''],
      estatusTema: [''],
      link: [''],
      descripcionMas: ['']
    });
  }

  ngOnInit() {
    this.loadTemas();
  }

  loadTemas() {
    this.apiTemas.getTemas().subscribe(res => {
      if(res.success){
        this.temas = res.data;
      }
    });
  }

  // === CARGAR IMAGEN ===
  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  // === GUARDAR / ACTUALIZAR ===
  submitForm() {
    const formData = new FormData();
    formData.append('descripcionTema', this.formTema.value.descripcionTema);
    formData.append('estatusTema', this.formTema.value.estatusTema);
    formData.append('link', this.formTema.value.link);
    formData.append('descripcionMas', this.formTema.value.descripcionMas);
    if (this.selectedImage) {
      formData.append('imagen', this.selectedImage);
    }

    if (this.editMode && this.selectedTemaId) {
      this.apiTemas.updateTema(this.selectedTemaId, formData).subscribe(res => {
        alert(res.message || 'Tema actualizado');
        // Actualizar en el arreglo local sin recargar toda la tabla
        const index = this.temas.findIndex(t => t.id_tema === this.selectedTemaId);
        if (index !== -1) {
          this.temas[index] = { ...this.temas[index], ...this.formTema.value };
        }
        this.closeModal();
      });
    } else {
      this.apiTemas.createTema(formData).subscribe(res => {
        alert('Tema creado');
        // Insertar nuevo tema al arreglo local
        if (res.data) {
          this.temas.push(res.data);
        } else {
          // fallback si el backend no devuelve el objeto creado
          this.loadTemas();
        }
        this.closeModal();
      });
    }
  }

  // === EDITAR ===
  editTema(tema: Temas) {
    this.editMode = true;
    this.selectedTemaId = tema.id_tema;
    this.formTema.patchValue({
      descripcionTema: tema.descripcionTema,
      estatusTema: tema.estatusTema,
      link: tema.link,
      descripcionMas: tema.descripcionMas
    });
    this.selectedImage = null;
    this.openModal();
  }

  // === MODAL ===
  openModal() {
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.resetForm();
  }

  // === RESETEAR FORM ===
  resetForm() {
    this.formTema.reset();
    this.editMode = false;
    this.selectedTemaId = null;
    this.selectedImage = null;
  }
}

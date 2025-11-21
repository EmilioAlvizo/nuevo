import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface OrganoInstitucional {
  id: number;
  title: string;
  icon: string;
  que: string;
  objetivoTitulo: string;
  objetivo: string;
}

@Component({
  selector: 'app-sistema-juventudes',
  imports: [ CommonModule],
  templateUrl: './sistema-juventudes.html',
  styleUrl: './sistema-juventudes.css'
})
export class SistemaJuventudes {
  flipped: { [key: number]: boolean } = {};

  cards: OrganoInstitucional[] = [
    {
      id: 1,
      title: 'SISTEMA PARA EL DESARROLLO Y ATENCIÓN A LAS JUVENTUDES DEL ESTADO DE GUANAJUATO',
      icon: '🏛️',
      que: 'Es el conjunto de instituciones, políticas públicas, programas, organismos auxiliares y de consulta, así como, registros de información en materia de juventudes, que promueven, protegen y difunden los derechos de los jóvenes en el estado de Guanajuato.',
      objetivoTitulo: 'Objetivo',
      objetivo: 'Ser instrumento base para la coordinación funcional, administrativa e institucional entre el Gobierno del Estado, organismos autónomos, instituciones privadas, sociales y educativas, organismos gubernamentales y no gubernamentales, así como, con organizaciones juveniles para la formulación e implementación de acciones en favor de los jóvenes en el estado de Guanajuato.'
    },
    {
      id: 2,
      title: 'SISTEMA DE INFORMACIÓN E INVESTIGACIÓN PARA EL DESARROLLO Y ATENCIÓN A LAS JUVENTUDES DEL ESTADO DE GUANAJAUTO',
      icon: '📖',
      que: `Es uno de los instrumentos rectores para la política de juventud en el estado. Cuenta además, con:
        
        <ul>
          <li>I. Un Sistema de Indicadores</li>
          <li>II. Una Red de Investigadores</li>
          <li>III. Evaluación de los programas del Sistema Único de Becas</li>
          <li>IV. Información sobre organizaciones y agrupaciones juveniles</li>
          <li>V. Información sobre apoyos y servicios dirigidos a la población joven</li>
          <li>VI. Información de becas, créditos y programas de movilidad internacional</li>
          <li>VII. Información que se considere trascendente para la vida de los jóvenes.</li>
        </ul>
      `,
      objetivoTitulo: 'Objetivo',
      objetivo: 'Estar conformado por mecanismos e instrumentos de recopilación, sistematización, organización, diagnóstico, intercambio, difusión, investigación, información, seguimiento y actualización sobre los temas de impacto en la educación y las juventudes.'
    },
    {
      id: 3,
      title: 'PROGRAMA ESTATAL PARA EL DESARROLLO Y ATENCIÓN A LAS JUVENTUDES DEL ESTADO DE GUANAJUATO',
      icon: '⚜️',
      que: 'Es el instrumento rector de la política para el desarrollo y atención a las juventudes del estado de Guanajuato y articulador del Sistema para el Desarrollo y Atención a las Juventudes del Estado de Guanajuato en el que se establecerán los objetivos, estrategias y acciones para promover el desarrollo integral de los jóvenes.',
      objetivoTitulo: '¿Cómo se construyó?',
      objetivo: `Su construcción representa la suma de esfuerzos entre sociedad y gobierno. El proceso se desarrolló a partir de las siguientes etapas:        
        
      <ul>
          <li>1. Análisis del entorno con principales variables</li>
          <li>2. Reuniones de coordinación gubernamental con los principales actores de cada una de las dependencias y entidades relacionadas con el Programa</li>
          <li>3. Consulta social y participación ciudadana realizada en línea en la que se opinó sobre los temas que consideran de mayor relevancia</li>
          <li>4. Los resultados de la consulta se dieron a conocer a los integrantes del Consejo Sectorial de Educación de Calidad, quienes enriquecieron el Programa</li>
        </ul>

        Tomado de Programa Estatal para el Desarrollo y Atención a las Juventudes del Estado de Guanajuato 2021-2024, pág. 95.
      `,
    },
    {
      id: 4,
      title: 'SISTEMA ÚNICO DE BECAS',
      icon: '🎓',
      que: 'Es un modelo que integra programas de apoyos, becas, estímulos y financiamiento educativo para que las y los guanajuatenses puedan continuar con la educación formal, así como para la vida.',
      objetivoTitulo: 'Objetivo',
      objetivo: 'Promover la política pública en el estado de Guanajuato en materia de otorgamiento de becas, estímulos, crédito educativo o apoyos, en especie para los estudiantes de todos los niveles educativos, de tipo formal y no formal, presenciales, semipresenciales o a distancia que requieran de apoyo para sus estudios.'
    }
  ];

  toggleFlip(id: number): void {
    this.flipped[id] = !this.flipped[id];
  }

  isFlipped(id: number): boolean {
    return this.flipped[id] || false;
  }
}
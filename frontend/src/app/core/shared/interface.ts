// Agrega esta nueva interfaz para la respuesta de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}

export interface ApiResponsePaginated<T> {
  success: boolean;
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

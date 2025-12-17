// frontend/src/app/services/authorized_emails.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthorizedEmail {
  id: number;
  email: string;
  authorized_by: string;
  authorized_at: string;
  used: boolean;
  used_at: string | null;
  // Nuevos campos
  usuario_activo: number | null;
  usuario_id: number | null;
  usuario_nombre: string | null;
}

export interface ApiResponse {
  success: boolean;
  data?: AuthorizedEmail[] | AuthorizedEmail;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiAuthorizedEmails {
  private apiUrl = `${environment.apiUrl}/authorized-emails`;
  private http = inject(HttpClient);

  getAuthorizedEmails(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  createAuthorizedEmail(data: { email: string; authorized_by?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, data);
  }

  updateAuthorizedEmail(id: number, data: { email: string; used?: boolean }): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, data);
  }

  updateUsuarioStatus(usuarioId: number, activo: boolean): Observable<ApiResponse> {
  return this.http.patch<ApiResponse>(
    `${this.apiUrl}/usuario/${usuarioId}/status`, 
    { activo }
  );
}

  // updateUsuarioStatus(email: string, activo: boolean): Observable<ApiResponse> {
  //   return this.http.patch<ApiResponse>(
  //     `${this.apiUrl}/authorized-emails/${email}/usuario-status`, 
  //     { activo }
  //   );
  // }

  deleteAuthorizedEmail(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
}
// frontend/src/app/services/authorized_emails.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthorizedEmail {
  id: number;
  email: string;
  authorized_by: string;
  authorized_at: string;
  used: boolean;
  used_at: string | null;
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
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getAuthorizedEmails(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/authorized-emails`);
  }

  createAuthorizedEmail(data: { email: string; authorized_by?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/authorized-emails`, data);
  }

  updateAuthorizedEmail(id: number, data: { email: string; used?: boolean }): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/authorized-emails/${id}`, data);
  }

  deleteAuthorizedEmail(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/authorized-emails/${id}`);
  }
}
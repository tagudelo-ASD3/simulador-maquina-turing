import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TapeStep {
  status: string;
  state: string;
  tape: string[];
  head: number;
  step: number;
}

@Injectable({ providedIn: 'root' })
export class TuringService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api';

  getAlgorithms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/algorithms`);
  }

  execute(algorithm: string, input1: string, input2 = ''): Observable<any> {
    return this.http.post<any>(`${this.base}/execute`, {
      algorithm, input1, input2, step_by_step: true
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, of } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  constructor(private http: HttpClient) {}

  /**
   * Avisa o back-end em C# que ela aceitou. Isso é só um "plus" —
   * se o back-end não estiver publicado, o app continua funcionando
   * normalmente (o erro é engolido).
   */
  sendResponse(accepted: boolean) {
    const body = { accepted, respondedAt: new Date().toISOString() };
    return this.http
      .post(`${environment.apiUrl}/api/proposal/respond`, body)
      .pipe(catchError(() => of(null)));
  }
}

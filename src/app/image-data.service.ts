import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ImageDataService {
  constructor(private http: HttpClient) {}

  getImages() {
    return this.http.get<string[]>('/api');
  }
}

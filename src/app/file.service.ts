import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class FileService {
    _baseURL = '/upload/';

    constructor(private http: HttpClient) { }

    upload(files) {
        return  this.http.post(this._baseURL, files)
                 .catch(error => Observable.throw(error));

    }
}

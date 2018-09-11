import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Metadata } from 'sharp';

@Injectable()
export class ImageDataService {
  constructor(private http: HttpClient) {}

  getImages() {
    return this.http.get<IApiData>('/api');
  }

  getOcrMetadata(item) {
    return this.http.get<IOcrMetadata>('/images/' + item + '-ocr.json');
  }

  getFaceMetadata(item) {
    return this.http.get<IFaceMetadata>('/images/' + item + '-face.json');
  }
}

export interface IApiData {
  data: string[];
  raw: string[];
}

export interface IOcrMetadata {
  lines: IOcrMetadataLine[];
  imageMetadata: Metadata;
}

export interface IOcrMetadataLine {
  boundingBox: number[];
  text: string;
  words?: IOcrMetadataLine[];
}

export interface IFaceMetadata {
  imageMetadata: Metadata;
  obj: IFaceMetadataItem[];
}

export interface IFaceMetadataItem {
  faceId: string;
  faceRectangle: { top: number; left: number; width: number; height: number };
}

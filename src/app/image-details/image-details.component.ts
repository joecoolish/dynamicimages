import {
  IFaceMetadata,
  IOcrMetadata,
  IOcrMetadataLine
} from './../image-data.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ImageDataService } from '../image-data.service';

@Component({
  selector: 'app-image-details',
  templateUrl: './image-details.component.html',
  styleUrls: ['./image-details.component.less']
})
export class ImageDetailsComponent implements OnInit {
  id: string;
  metadata: string[];
  faceMetadata: IFaceMetadata;
  ocrMetadata: IOcrMetadata;
  showYolo: boolean;
  showOcr: boolean;
  showFace: boolean;

  constructor(
    private route: ActivatedRoute,
    private imageService: ImageDataService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params.id;
    });
    this.imageService
      .getImages()
      .toPromise()
      .then(ret => {
        this.metadata = ret.data.filter(d => d.startsWith(this.id));
        if (this.hasFace()) {
          this.imageService
            .getFaceMetadata(this.id)
            .toPromise()
            .then(faceRet => (this.faceMetadata = faceRet));
        }

        if (this.hasOcr()) {
          this.imageService
            .getOcrMetadata(this.id)
            .toPromise()
            .then(ocrRet => (this.ocrMetadata = ocrRet));
        }
      });
  }

  hasFace() {
    return (
      (this.metadata || []).filter(item => item.endsWith('face.json')).length >
      0
    );
  }

  hasOcr() {
    return (
      (this.metadata || []).filter(item => item.endsWith('ocr.json')).length > 0
    );
  }

  hasYolo() {
    return (
      (this.metadata || []).filter(item => item.endsWith('.png')).length > 0
    );
  }

  ocrSort(lines: IOcrMetadataLine[]) {
    const ret = [...lines];
    ret.sort((a, b) => {
      const al = [
        a.boundingBox[1],
        a.boundingBox[3],
        a.boundingBox[5],
        a.boundingBox[7]
      ].sort();

      const bl = [
        b.boundingBox[1],
        b.boundingBox[3],
        b.boundingBox[5],
        b.boundingBox[7]
      ].sort();

      return (al[0] - bl[0]);
    });
    return ret;
  }
}

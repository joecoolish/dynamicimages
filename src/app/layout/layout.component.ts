import { Component, OnInit } from '@angular/core';
import { ImageDataService, IApiData } from '../image-data.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  images = [];
  data: IApiData;

  constructor(private imageService: ImageDataService) {}

  ngOnInit() {
    setInterval(() => {
      this.imageService
        .getImages()
        .toPromise()
        .then(ret => {
          this.data = ret;
          if (ret && ret.raw) {
            this.images = ret.raw.filter(img => {
              return img.endsWith('.png') || img.endsWith('.jpg');
            });
          }
        });
    }, 10000);
  }

  refreshImages(status) {
    if (status === true) {
      console.log('Uploaded successfully!');
    }
  }

  getMetadata(image) {
    return this.data.data.filter(i => i.startsWith(image));
  }
}

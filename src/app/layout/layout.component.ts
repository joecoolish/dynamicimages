import { Component, OnInit } from '@angular/core';
import { ImageDataService } from '../image-data.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  images = [];

  constructor(private imageService: ImageDataService) {}

  ngOnInit() {
    setInterval(() => {
      this.imageService
        .getImages()
        .toPromise()
        .then(raw => (this.images = raw.filter(img => {
          return img.endsWith('.png') || img.endsWith('.jpg');
        })));
    }, 1000);
  }
}

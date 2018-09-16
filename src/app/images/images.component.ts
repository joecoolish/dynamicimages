import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-images',
  templateUrl: './images.component.html',
  styleUrls: ['./images.component.less']
})
export class ImagesComponent implements OnInit {

  @Input() image: string;
  @Input() metadata: string[];

  constructor() { }

  ngOnInit() {
  }

  hasFace() {
    return (this.metadata || []).filter(item => item.endsWith('face.json')).length > 0;
  }

  hasOcr() {
    return (this.metadata || []).filter(item => item.endsWith('ocr.json')).length > 0;
  }

  hasYolo() {
    return (this.metadata || []).filter(item => item.endsWith('.jpg')).length > 0;
  }
}

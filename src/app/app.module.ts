import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ServiceWorkerModule } from '@angular/service-worker';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';
import { LayoutComponent } from './layout/layout.component';
import { LinksComponent } from './links/links.component';
import { ImagesComponent } from './images/images.component';
import { ImageDataService } from './image-data.service';

@NgModule({
  declarations: [AppComponent, LayoutComponent, LinksComponent, ImagesComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    ServiceWorkerModule.register('/ngsw-worker.js', {
      enabled: environment.production
    })
  ],
  providers: [ImageDataService],
  bootstrap: [AppComponent]
})
export class AppModule {}

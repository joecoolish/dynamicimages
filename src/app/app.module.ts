import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';

import { ServiceWorkerModule } from '@angular/service-worker';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';
import { LayoutComponent } from './layout/layout.component';
import { LinksComponent } from './links/links.component';
import { ImagesComponent } from './images/images.component';
import { ImageDataService } from './image-data.service';
import { FileService } from './file.service';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ImageDetailsComponent } from './image-details/image-details.component';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

const appRoutes: Routes = [
  { path: 'imagelist', component: LayoutComponent },
  { path: 'image/:id', component: ImageDetailsComponent },
  {
    path: '',
    redirectTo: '/imagelist',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    LinksComponent,
    ImagesComponent,
    FileUploadComponent,
    PageNotFoundComponent,
    ImageDetailsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(
      appRoutes
      // { enableTracing: true } // <-- debugging purposes only
    ),
    ServiceWorkerModule.register('/ngsw-worker.js', {
      enabled: environment.production
    }),
    AngularFontAwesomeModule
  ],
  providers: [ImageDataService, FileService],
  bootstrap: [AppComponent]
})
export class AppModule {}

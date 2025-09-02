import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    importProvidersFrom(SweetAlert2Module.forRoot()),
  ],
}).catch((err: unknown) => console.error(err));

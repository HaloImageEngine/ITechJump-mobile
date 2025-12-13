import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

// Disable console logs in production for performance
if (environment.production) {
  console.log = () => {};
  console.debug = () => {};
  console.warn = () => {};
  // Keep console.error for critical issues
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...(appConfig.providers || []), { provide: 'ROUTES', useValue: routes }]
})
  .catch(err => console.error(err));

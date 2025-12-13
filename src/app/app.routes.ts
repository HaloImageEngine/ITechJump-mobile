import { SearchComponent } from './pages/search/search.component';
import { Routes } from '@angular/router';
import { MainPageComponent } from './pages/main-page/main-page';
import { TestComponent } from './pages/test/test.component';
import { ReviewComponent } from './pages/review/review.component';
import { ScoresComponent } from './pages/scores/scores.component';
import { RegisterComponent } from './pages/register/register.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AboutComponent } from './pages/about/about.component';
import { Subscribe1Component } from './pages/subscribe1/subscribe1.component';
import { Subscribe2Component } from './pages/subscribe2/subscribe2.component';
import { Subscribe3Component } from './pages/subscribe3/subscribe3.component';
import { LoginComponent } from './pages/login/login.component';
import { LogoffComponent } from './pages/logoff/logoff.component';
import { PcTestComponent } from './pages/pc-test/pc-test.component';





export const routes: Routes = [
  { path: '', redirectTo: 'main-page', pathMatch: 'full' }, // default route

  { path: 'main-page', component: MainPageComponent },
  { path: 'test', component: TestComponent },
  { path: 'search', component: SearchComponent },
  { path: 'review', component: ReviewComponent },
  { path: 'scores', component: ScoresComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'subscribe1', component: Subscribe1Component },
  { path: 'subscribe2', component: Subscribe2Component },
  { path: 'subscribe3', component: Subscribe3Component },
  { path: 'login', component: LoginComponent },
  { path: 'logoff', component: LogoffComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'pc-test', component: PcTestComponent },

  { path: '**', redirectTo: 'main-page' } // wildcard fallback
];

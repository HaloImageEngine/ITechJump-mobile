import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment.prod';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: '../footer/footer.component.html',
  styleUrls: ['../footer/footer.component.scss']
})
export class FooterComponent {
  year = new Date().getFullYear();
  appVersion = environment.appVersion;
}

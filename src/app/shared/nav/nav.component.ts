import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment'; // adjust path if needed

type NavChild = {
  label: string;
  route?: string;
  title?: string;
};

type NavItem = {
  label: string;
  route?: string;
  exact?: boolean;
  children?: NavChild[];
};

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
  private router = inject(Router);

  menuOpen = signal(false);
  openDropdownLabel = signal<string | null>(null);
  showVersion = signal(false);

  // Use the app-wide version from environment
  version = environment.appVersion;

  navItems: NavItem[] = [
    { label: 'Main', route: '/main', exact: true },
    { label: 'Search', route: '/search' },
    {
      label: 'Testing',
      children: [
        { label: 'PC Test ', route: '/pc-test', title: 'Take a test using text answers on PC' },
        { label: 'Mobile ', route: '/test-mobile', title: 'Take a test using voice recording on mobile' },
        { label: 'Review ', route: '/review', title: 'Review your previous test answers' },
        { label: 'Scores ', route: '/scores', title: 'View your test scores and grades' },
        { label: 'Add Your Questions', route: '/subscribe3', title: 'Submit your own interview questions' }
      ]
    },
    {
      label: 'Register',
      children: [
        { label: 'Login', route: '/login', title: 'Login to your account' },
        { label: 'Register', route: '/register', title: 'Create a new account' },
        { label: 'Subscribe1', route: '/subscribe1', title: 'View subscription tier 1' },
        { label: 'Subscribe2', route: '/subscribe2', title: 'View subscription tier 2' },
        { label: 'Subscribe3', route: '/subscribe3', title: 'View subscription tier 3' }
      ]
    },
    {
      label: 'About',
      children: [
        { label: 'Info', route: '/about', title: 'Learn more about ITechJump' },
        { label: 'Contact', route: '/contact', title: 'Get in touch with us' },
        { label: `Version ${this.version}`, title: 'View application version information' } // handled as popup
      ]
    }
  ];

  // ---------------- Menu / dropdowns ----------------

  toggleMenu() {
    this.menuOpen.update((v) => !v);
    if (!this.menuOpen()) {
      this.openDropdownLabel.set(null);
    }
  }

  closeMenu() {
    this.menuOpen.set(false);
    this.openDropdownLabel.set(null);
  }

  toggleDropdown(label: string) {
    this.openDropdownLabel.update((current) =>
      current === label ? null : label
    );
  }

  isDropdownOpen(label: string): boolean {
    return this.openDropdownLabel() === label;
  }

  handleSubItemClick() {
    // Used for submenu routes (Info, Contact, PC Test, etc.)
    this.closeMenu();
  }

  openVersion() {
    this.showVersion.set(true);
  }

  closeVersion() {
    this.showVersion.set(false);
  }
}

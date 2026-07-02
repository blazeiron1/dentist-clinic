import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { HealthService } from '../../core/services/health.service';
import { BackupStatusService } from '../../core/services/backup-status.service';
import { TipService } from '../../core/services/tip.service';
import { TipToastComponent } from '../../shared/components/tip-toast/tip-toast.component';

interface NavItem { label: string; icon: string; route: string; alsoActive?: string[]; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule,
    TipToastComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  auth = inject(AuthService);
  health = inject(HealthService);
  backupStatus = inject(BackupStatusService);
  private tipSvc = inject(TipService);
  private navSub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Календар', icon: 'calendar_month', route: '/calendar', alsoActive: ['/appointments'] },
    { label: 'Пациенти', icon: 'people', route: '/patients' },
    { label: 'Извештаи', icon: 'bar_chart', route: '/reports' },
    { label: 'Каталог', icon: 'medical_services', route: '/catalog' },
    { label: 'Помош', icon: 'help_outline', route: '/help' },
    { label: 'Подесувања', icon: 'settings', route: '/settings' },
  ];

  isActive(item: NavItem): boolean {
    const url = this.router.url;
    if (url.startsWith(item.route)) return true;
    return item.alsoActive?.some(prefix => url.startsWith(prefix)) ?? false;
  }

  ngOnInit(): void {
    this.health.startPolling();
    this.backupStatus.load();
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.tipSvc.tryShowRandomTip());
  }

  ngOnDestroy(): void {
    this.health.stopPolling();
    this.navSub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ClinicInfoService } from './core/services/clinic-info.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private clinicInfoService = inject(ClinicInfoService);

  ngOnInit(): void {
    this.auth.restoreSession();
    this.clinicInfoService.load().subscribe();
  }
}

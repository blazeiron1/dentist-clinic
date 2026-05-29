import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('admin@dentalclinic.mk');
  password = signal('admin');
  hidePassword = signal(true);
  error = signal('');

  submit(): void {
    if (!this.email() || !this.password()) {
      this.error.set('Внесете е-пошта и лозинка');
      return;
    }
    const ok = this.auth.login(this.email(), this.password());
    if (ok) this.router.navigate(['/calendar']);
    else this.error.set('Погрешни податоци');
  }
}

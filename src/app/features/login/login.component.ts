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


  username = signal('');
  password = signal('');
  hidePassword = signal(true);
  error = signal('');
  loading = signal(false);
  submitted = signal(false);

  submit(): void {
    this.submitted.set(true);
    if (!this.username() || !this.password()) {
      this.error.set('Внесете корисничко име и лозинка');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username(), this.password()).subscribe(ok => {
      this.loading.set(false);
      if (ok) this.router.navigate(['/calendar']);
      else this.error.set('Погрешни податоци');
    });
  }
}

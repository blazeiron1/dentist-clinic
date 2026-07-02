import { Component, inject, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TipService } from '../../../core/services/tip.service';

@Component({
  selector: 'app-tip-toast',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="tip-toast" [class.slide-in]="visible()">
        <div class="tip-header">
          <mat-icon class="tip-icon">{{ tipSvc.activeTip()!.icon }}</mat-icon>
          <span class="tip-title">{{ tipSvc.activeTip()!.title }}</span>
          <button mat-icon-button class="tip-close" (click)="dismiss()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <p class="tip-body">{{ tipSvc.activeTip()!.body }}</p>
        <div class="tip-footer">
          <button mat-button color="primary" (click)="dismiss()">Океј</button>
          <div class="tip-timer">
            <div class="tip-timer-bar" [style.animation-duration]="'8s'"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tip-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 340px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08);
      z-index: 1000;
      overflow: hidden;
      animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .tip-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 8px 0 16px;
    }
    .tip-icon {
      color: var(--mat-sys-primary, #1976d2);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .tip-title {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: rgba(0,0,0,.87);
    }
    .tip-close {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
    .tip-close mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tip-body {
      padding: 8px 16px 0;
      font-size: 13px;
      color: rgba(0,0,0,.6);
      line-height: 1.5;
      margin: 0;
    }
    .tip-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 4px 8px 8px;
    }
    .tip-timer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0,0,0,.06);
    }
    .tip-timer-bar {
      height: 100%;
      background: var(--mat-sys-primary, #1976d2);
      animation: shrink linear forwards;
    }
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `],
})
export class TipToastComponent {
  tipSvc = inject(TipService);
  visible = signal(false);

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const tip = this.tipSvc.activeTip();
      if (tip) {
        this.visible.set(true);
        this.clearTimer();
        this.autoHideTimer = setTimeout(() => this.dismiss(), 8000);
      } else {
        this.visible.set(false);
      }
    });
  }

  dismiss(): void {
    const tip = this.tipSvc.activeTip();
    if (tip) {
      this.tipSvc.dismissTip(tip);
    }
    this.visible.set(false);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
}

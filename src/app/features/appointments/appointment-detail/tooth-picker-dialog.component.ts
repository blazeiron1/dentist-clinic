import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ToothChartComponent } from '../../../shared/components/tooth-chart';

@Component({
  selector: 'app-tooth-picker-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ToothChartComponent],
  template: `
<h2 mat-dialog-title>Избери заби</h2>
<mat-dialog-content>
  <app-tooth-chart [(selectedTeeth)]="selected" />
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Откажи</button>
  <button mat-flat-button color="primary" (click)="save()">Примени ({{ selected().length }})</button>
</mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; justify-content: center; padding: 8px 0 !important; overflow-x: auto; }
  `],
})
export class ToothPickerDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { selected: number[] };
  private dialogRef = inject(MatDialogRef<ToothPickerDialogComponent>);

  selected = signal<number[]>(this.data.selected ?? []);

  save(): void {
    this.dialogRef.close(this.selected());
  }
}

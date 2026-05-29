import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToothState {
  toothNumber: number;
  /** FDI tooth number */
  selected: boolean;
  interventionColor?: string; // hex color when tooth has a saved intervention
}

// FDI layout: upper row right→left then left→right, lower row right→left then left→right
// Standard chart view (from clinician facing patient):
//   Upper: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
//   Lower: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

export const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT];

// ── SVG arch geometry ────────────────────────────────────────────────────────
// Each tooth is placed along an elliptical arch.
// Upper arch: top half of ellipse.  Lower arch: bottom half.
// We compute (cx, cy) for each tooth position around the ellipse.

const SVG_W = 520;
const SVG_H = 480;
const CX = SVG_W / 2;   // ellipse centre x
const CY = SVG_H / 2;   // ellipse centre y
const RX_OUTER = 220;   // horizontal radius (outer)
const RY_OUTER = 195;   // vertical radius (outer)
const RX_INNER = 155;
const RY_INNER = 130;
const TOOTH_R  = 18;    // tooth circle radius

function archPositions(
  teeth: number[],
  startAngleDeg: number,
  endAngleDeg: number,
  rx: number,
  ry: number,
): { id: number; cx: number; cy: number }[] {
  const n = teeth.length;
  return teeth.map((id, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angleDeg = startAngleDeg + t * (endAngleDeg - startAngleDeg);
    const rad = (angleDeg * Math.PI) / 180;
    return {
      id,
      cx: Math.round(CX + rx * Math.cos(rad)),
      cy: Math.round(CY + ry * Math.sin(rad)),
    };
  });
}

// Upper arch: angles go from ~200° to ~340° (top of ellipse, going left→right in screen)
// but we want upper-right teeth (18..11) on the left side and upper-left (21..28) on the right.
// Standard SVG: 0°=right, 90°=bottom. Upper half is 180°..360°.
// Upper RIGHT quadrant (18→11): 200° → 270° (left side going to top)
// Upper LEFT  quadrant (21→28): 270° → 340° (top going to right)
// Lower RIGHT quadrant (48→41): 160° → 90° = we go 160°→90° (left side going down) → reverse
// Lower LEFT  quadrant (31→38): 90° → 20°   → going right-downward

const upperRight = archPositions(UPPER_RIGHT, 200, 267, RX_OUTER, RY_OUTER);
const upperLeft  = archPositions(UPPER_LEFT,  273, 340, RX_OUTER, RY_OUTER);
const lowerRight = archPositions(LOWER_RIGHT, 160,  93, RX_INNER, RY_INNER);
const lowerLeft  = archPositions(LOWER_LEFT,   87,  20, RX_INNER, RY_INNER);

const TOOTH_POSITIONS = new Map(
  [...upperRight, ...upperLeft, ...lowerRight, ...lowerLeft].map(t => [t.id, { cx: t.cx, cy: t.cy }]),
);

// Tooth shape type: molars are bigger, incisors/canines smaller
function toothSize(fdi: number): number {
  const pos = fdi % 10; // last digit = position 1–8
  if (pos === 8) return TOOTH_R + 3;       // 3rd molar
  if (pos === 7 || pos === 6) return TOOTH_R + 2; // molars
  if (pos === 5 || pos === 4) return TOOTH_R;    // premolars
  if (pos === 3) return TOOTH_R - 2;       // canine
  return TOOTH_R - 4;                      // incisors 1,2
}

@Component({
  selector: 'app-tooth-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooth-chart.component.html',
  styleUrl: './tooth-chart.component.scss',
})
export class ToothChartComponent {
  /** Teeth that have a saved intervention. Map of FDI number → hex color. */
  interventionTeeth = input<Map<number, string>>(new Map());

  /** Currently selected tooth numbers (two-way bindable). */
  selectedTeeth = model<number[]>([]);

  /** Emitted on every toggle when not readonly. */
  toothToggled = output<number>();

  /** When true, clicks are ignored and selection ring is not shown. */
  readonly = input(false);

  /** Focused tooth for keyboard navigation. */
  protected focusedTooth = signal<number | null>(null);

  protected readonly allTeeth = ALL_TEETH;
  protected readonly positions = TOOTH_POSITIONS;
  protected readonly svgW = SVG_W;
  protected readonly svgH = SVG_H;

  protected toothSize = toothSize;

  protected isSelected = computed(() => {
    const set = new Set(this.selectedTeeth());
    return (id: number) => set.has(id);
  });

  protected interventionColor(id: number): string | null {
    return this.interventionTeeth().get(id) ?? null;
  }

  protected toggle(id: number): void {
    if (this.readonly()) return;
    const current = this.selectedTeeth();
    const next = current.includes(id)
      ? current.filter(t => t !== id)
      : [...current, id];
    this.selectedTeeth.set(next);
    this.toothToggled.emit(id);
  }

  protected onKeydown(event: KeyboardEvent, id: number): void {
    if (this.readonly()) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle(id);
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus(id, 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(id, -1);
    }
  }

  private moveFocus(currentId: number, delta: number): void {
    const idx = ALL_TEETH.indexOf(currentId);
    const nextIdx = (idx + delta + ALL_TEETH.length) % ALL_TEETH.length;
    const nextId = ALL_TEETH[nextIdx];
    this.focusedTooth.set(nextId);
    document.getElementById(`tooth-${nextId}`)?.focus();
  }

  protected labelOffset(fdi: number): { dx: number; dy: number } {
    const pos = this.positions.get(fdi)!;
    const dx = pos.cx < CX ? -1 : pos.cx > CX ? 1 : 0;
    const dy = pos.cy < CY ? -1 : pos.cy > CY ? 1 : 0;
    const r = toothSize(fdi) + 10;
    return { dx: dx * r, dy: dy * r + 4 };
  }
}

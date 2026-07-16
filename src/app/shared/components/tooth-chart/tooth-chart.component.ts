import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

export const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT];

const SVG_W = 500;
const SVG_H = 550;

const UPPER = { cx: 250, cy: 200, rx: 185, ry: 168 };
const LOWER = { cx: 250, cy: 350, rx: 175, ry: 152 };

// Tooth dimensions by FDI last digit
const DIMS: Record<number, { w: number; h: number; r: number }> = {
  1: { w: 15, h: 13, r: 3 },
  2: { w: 13, h: 15, r: 3 },
  3: { w: 14, h: 19, r: 5 },
  4: { w: 18, h: 17, r: 4 },
  5: { w: 20, h: 18, r: 4 },
  6: { w: 27, h: 25, r: 5 },
  7: { w: 26, h: 24, r: 5 },
  8: { w: 22, h: 21, r: 5 },
};

export interface ToothPos {
  id: number;
  cx: number;
  cy: number;
  rot: number;
  w: number;
  h: number;
  r: number;
  pos: number;
  labelX: number;
  labelY: number;
  grooveH: string;
  grooveV: string;
}

function buildTeeth(
  teeth: number[],
  startDeg: number,
  endDeg: number,
  arch: { cx: number; cy: number; rx: number; ry: number },
): ToothPos[] {
  const n = teeth.length;
  return teeth.map((id, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const deg = startDeg + t * (endDeg - startDeg);
    const rad = (deg * Math.PI) / 180;
    const cx = Math.round(arch.cx + arch.rx * Math.cos(rad));
    const cy = Math.round(arch.cy + arch.ry * Math.sin(rad));
    const pos = id % 10;
    const dim = DIMS[pos];

    // Label offset: outward from arch center
    const dx = cx - arch.cx;
    const dy = cy - arch.cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const labelDist = Math.max(dim.w, dim.h) / 2 + 13;
    const labelX = Math.round(cx + (dx / dist) * labelDist);
    const labelY = Math.round(cy + (dy / dist) * labelDist);

    // Groove paths (curved for natural look)
    const hw = dim.w * 0.32;
    const hh = dim.h * 0.32;
    const grooveH = `M${-hw},${dim.h * 0.04} Q0,${-dim.h * 0.08} ${hw},${dim.h * 0.04}`;
    const grooveV = `M${-dim.w * 0.04},${-hh} Q${dim.w * 0.06},0 ${-dim.w * 0.04},${hh}`;

    return { id, cx, cy, rot: deg + 90, w: dim.w, h: dim.h, r: dim.r, pos, labelX, labelY, grooveH, grooveV };
  });
}

const ALL_POSITIONS: ToothPos[] = [
  ...buildTeeth(UPPER_RIGHT, 198, 265, UPPER),
  ...buildTeeth(UPPER_LEFT, 275, 342, UPPER),
  ...buildTeeth(LOWER_RIGHT, 162, 95, LOWER),
  ...buildTeeth(LOWER_LEFT, 85, 18, LOWER),
];

@Component({
  selector: 'app-tooth-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooth-chart.component.html',
  styleUrl: './tooth-chart.component.scss',
})
export class ToothChartComponent {
  interventionTeeth = input<Map<number, string>>(new Map());
  selectedTeeth = model<number[]>([]);
  toothToggled = output<number>();
  readonly = input(false);

  protected focusedTooth = signal<number | null>(null);
  protected readonly teeth = ALL_POSITIONS;
  protected readonly svgW = SVG_W;
  protected readonly svgH = SVG_H;
  protected readonly midX = SVG_W / 2;

  protected readonly UPPER_JAW = [...UPPER_RIGHT, ...UPPER_LEFT];
  protected readonly LOWER_JAW = [...LOWER_RIGHT, ...LOWER_LEFT];
  protected readonly RIGHT_SIDE = [...UPPER_RIGHT, ...LOWER_RIGHT];
  protected readonly LEFT_SIDE = [...UPPER_LEFT, ...LOWER_LEFT];

  protected isSelected = computed(() => {
    const set = new Set(this.selectedTeeth());
    return (id: number) => set.has(id);
  });

  protected isGroupFullySelected(group: number[]): boolean {
    const set = new Set(this.selectedTeeth());
    return group.every(id => set.has(id));
  }

  protected toggleGroup(group: number[]): void {
    if (this.readonly()) return;
    const current = this.selectedTeeth();
    const currentSet = new Set(current);
    const allSelected = group.every(id => currentSet.has(id));

    if (allSelected) {
      const removeSet = new Set(group);
      this.selectedTeeth.set(current.filter(id => !removeSet.has(id)));
    } else {
      const merged = new Set([...current, ...group]);
      this.selectedTeeth.set([...merged]);
    }
  }

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
}

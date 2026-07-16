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

// Occlusal tooth shapes per FDI last digit (1-8)
// Centered at (0,0). Local coords: x = mesio-distal, y = bucco-lingual (neg y = buccal/labial = outward)
interface ToothShape {
  outline: string;
  grooves: string[];
  w: number;
  h: number;
}

const SHAPES: Record<number, ToothShape> = {
  // Central incisor: wide shovel shape, flat incisal edge
  1: {
    outline: 'M-5.5,-5 L5.5,-5 C6.5,-5 7,-3.5 7,-1 L6.5,4 C6,6 3.5,7 0,7 C-3.5,7 -6,6 -6.5,4 L-7,-1 C-7,-3.5 -6.5,-5 -5.5,-5 Z',
    grooves: ['M-3.5,3 Q0,1 3.5,3'],
    w: 14, h: 12,
  },
  // Lateral incisor: narrower, slightly rounded
  2: {
    outline: 'M-4.5,-5.5 L4.5,-5.5 C5.5,-5.5 6,-4 6,-2 L5.5,4 C5,6 3,7 0,7 C-3,7 -5,6 -5.5,4 L-6,-2 C-6,-4 -5.5,-5.5 -4.5,-5.5 Z',
    grooves: ['M-3,3.5 Q0,1.5 3,3.5'],
    w: 12, h: 12.5,
  },
  // Canine: diamond/shield with prominent cusp tip
  3: {
    outline: 'M0,-9.5 C3.5,-8 5.5,-4.5 6,0 C6.5,4.5 4,7.5 2,8.5 L-2,8.5 C-4,7.5 -6.5,4.5 -6,0 C-5.5,-4.5 -3.5,-8 0,-9.5 Z',
    grooves: ['M0,-5.5 Q0.5,0 0,6'],
    w: 12, h: 18,
  },
  // First premolar: oval with two cusps
  4: {
    outline: 'M0,-8 C5,-8 7.5,-5 7.5,0 C7.5,5 5,8 0,8 C-5,8 -7.5,5 -7.5,0 C-7.5,-5 -5,-8 0,-8 Z',
    grooves: [
      'M-6,0 C-3,-2.5 3,-2.5 6,0',
      'M0,-5.5 C0.5,-1 0.5,1 0,5.5',
    ],
    w: 15, h: 16,
  },
  // Second premolar: rounder, Y-groove
  5: {
    outline: 'M0,-8.5 C5.5,-8.5 8,-5 8,0 C8,5 5.5,8.5 0,8.5 C-5.5,8.5 -8,5 -8,0 C-8,-5 -5.5,-8.5 0,-8.5 Z',
    grooves: [
      'M-6.5,0 C-3,-2 3,-2 6.5,0',
      'M0,-6 C0.5,-1 0.5,1 0,6',
    ],
    w: 16, h: 17,
  },
  // First molar: largest, rhomboidal with H-fissure
  6: {
    outline: 'M-6,-10.5 C-2,-12 3,-12 7,-10.5 C10.5,-8 11.5,-4 11.5,0 C11.5,5 10.5,9 7,11 C3,12.5 -2,12.5 -6,11 C-10.5,9 -11.5,5 -11.5,0 C-11.5,-4 -10.5,-8 -6,-10.5 Z',
    grooves: [
      'M-9.5,0 C-5,-3 5,-3 9.5,0',
      'M-1,-10 C-1.5,-4 -1.5,4 -1,10',
      'M-8,-6 C-5.5,-3.5 -3.5,-2 -1.5,-0.5',
      'M8,-6 C5.5,-3.5 3.5,-2 1,-0.5',
    ],
    w: 23, h: 24,
  },
  // Second molar: slightly smaller
  7: {
    outline: 'M-5.5,-9.5 C-1.5,-11 2,-11 6,-9.5 C9.5,-7.5 10.5,-3.5 10.5,0 C10.5,4.5 9.5,8 6,10 C2,11.5 -1.5,11.5 -5.5,10 C-9.5,8 -10.5,4.5 -10.5,0 C-10.5,-3.5 -9.5,-7.5 -5.5,-9.5 Z',
    grooves: [
      'M-8.5,0 C-4,-2.5 4,-2.5 8.5,0',
      'M-0.5,-9 C-1,-3 -1,3 -0.5,9',
      'M7,-5.5 C4.5,-3 2.5,-1.5 0.5,-0.5',
    ],
    w: 21, h: 22,
  },
  // Third molar: smallest molar, irregular shape
  8: {
    outline: 'M-4.5,-8 C0,-9.5 4.5,-8.5 7,-6 C9,-3.5 9.5,0 9,3.5 C8.5,7 5.5,9 2,9 C-1.5,9.5 -5.5,8.5 -7.5,5.5 C-9.5,2.5 -9.5,-1 -8.5,-4 C-7.5,-7 -4.5,-8 -4.5,-8 Z',
    grooves: [
      'M-7,0.5 C-3,-1.5 3.5,-1 7,0.5',
      'M-0.5,-7 C-1,-2 -0.5,2 0,7',
    ],
    w: 19, h: 18.5,
  },
};

export interface ToothPos {
  id: number;
  cx: number;
  cy: number;
  rot: number;
  w: number;
  h: number;
  pos: number;
  labelX: number;
  labelY: number;
  outline: string;
  grooves: string[];
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
    const shape = SHAPES[pos];

    // Label offset: outward from arch center
    const dx = cx - arch.cx;
    const dy = cy - arch.cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const labelDist = Math.max(shape.w, shape.h) / 2 + 13;
    const labelX = Math.round(cx + (dx / dist) * labelDist);
    const labelY = Math.round(cy + (dy / dist) * labelDist);

    return {
      id, cx, cy,
      rot: deg + 90,
      w: shape.w, h: shape.h,
      pos, labelX, labelY,
      outline: shape.outline,
      grooves: shape.grooves,
    };
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

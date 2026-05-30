# Frontend Implementation Guide - Intervention Draft Workflow

## Overview
This guide explains the frontend changes needed to implement the new draft-and-finalize intervention workflow with 2-second debouncing on input changes.

## Key Changes Required

### 1. **Remove Immediate API Calls on Button Click**
**Before:** Clicking "Add Intervention" immediately sent a POST request without data
**After:** Only creates an empty draft, without auto-saving

### 2. **Add Debouncing to Input Changes**
**Before:** Every keystroke triggered an API call
**After:** API calls are debounced to 2 seconds after the user stops typing

### 3. **Separate Draft Creation from Finalization**
**Before:** Single save action
**After:** Two actions - Create Draft → Edit → Finalize

### 4. **Display Status Indicator**
Show users whether an intervention is DRAFT or COMPLETED

---

## Implementation by Framework

### React Implementation

#### Option 1: Using Custom Debounce Hook

**`useDebounce.ts`**
```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**`InterventionForm.tsx`**
```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

interface Intervention {
  id: number | null;
  appointmentId: number;
  name: string;
  price: number;
  teeth: number[];
  note: string;
  status: 'DRAFT' | 'COMPLETED';
}

export function InterventionForm({ appointmentId, onSaved }) {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the intervention data (2 seconds)
  const debouncedIntervention = useDebounce(intervention, 2000);

  // Effect: Save draft when debounced intervention changes
  useEffect(() => {
    if (!debouncedIntervention?.id || debouncedIntervention.status !== 'DRAFT') {
      return;
    }

    saveDraft(debouncedIntervention);
  }, [debouncedIntervention]);

  const createDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/v1/appointments/${appointmentId}/interventions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
            price: 0,
            teeth: [],
            note: ''
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create draft');
      }

      const draft = await response.json();
      setIntervention(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async (data: Intervention) => {
    try {
      const response = await fetch(`/api/v1/interventions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          price: data.price,
          teeth: data.teeth,
          note: data.note
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const updated = await response.json();
      setIntervention(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const finalize = async () => {
    if (!intervention?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/v1/interventions/${intervention.id}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: intervention.name.trim(),
            price: intervention.price,
            teeth: intervention.teeth,
            note: intervention.note
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to finalize intervention');
      }

      const finalized = await response.json();
      setIntervention(finalized);
      onSaved?.(finalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setIntervention(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      };
    });
  };

  const handleTeethChange = (teeth: number[]) => {
    setIntervention(prev => {
      if (!prev) return null;
      return { ...prev, teeth };
    });
  };

  if (!intervention) {
    return (
      <div className="intervention-form">
        <button
          onClick={createDraft}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Creating...' : 'Add Intervention'}
        </button>
      </div>
    );
  }

  return (
    <div className="intervention-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Intervention Name</label>
        <input
          id="name"
          type="text"
          name="name"
          value={intervention.name}
          onChange={handleInputChange}
          placeholder="e.g., Cleaning, Root Canal"
          disabled={intervention.status !== 'DRAFT'}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price">Price</label>
        <input
          id="price"
          type="number"
          name="price"
          value={intervention.price}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          placeholder="0.00"
          disabled={intervention.status !== 'DRAFT'}
        />
      </div>

      <div className="form-group">
        <label htmlFor="note">Notes</label>
        <textarea
          id="note"
          name="note"
          value={intervention.note}
          onChange={handleInputChange}
          placeholder="Additional notes..."
          disabled={intervention.status !== 'DRAFT'}
        />
      </div>

      <div className="form-group">
        <label>Selected Teeth</label>
        <TeethSelector
          selected={intervention.teeth}
          onChange={handleTeethChange}
          disabled={intervention.status !== 'DRAFT'}
        />
      </div>

      <div className="form-actions">
        <div className="status-display">
          <span className={`badge badge-${intervention.status.toLowerCase()}`}>
            {intervention.status}
          </span>
        </div>

        {intervention.status === 'DRAFT' && (
          <button
            onClick={finalize}
            disabled={isLoading || !intervention.name.trim()}
            className="btn-success"
          >
            {isLoading ? 'Saving...' : 'Save Intervention'}
          </button>
        )}

        {intervention.status === 'COMPLETED' && (
          <div className="text-success">✓ Intervention saved</div>
        )}
      </div>
    </div>
  );
}
```

#### Option 2: Using useMemo and useCallback

```typescript
import { useMemo, useCallback, useState, useEffect } from 'react';

export function InterventionForm({ appointmentId, onSaved }) {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced update function
  const debouncedSaveDraft = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (data: Intervention) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveDraft(data);
        }, 2000); // 2 second delay
      };
    })(),
    []
  );

  const saveDraft = async (data: Intervention) => {
    if (!data?.id || data.status !== 'DRAFT') return;

    try {
      const response = await fetch(`/api/v1/interventions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          price: data.price,
          teeth: data.teeth,
          note: data.note
        })
      });

      if (!response.ok) throw new Error('Failed to save draft');
      const updated = await response.json();
      setIntervention(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setIntervention(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          [name]: type === 'number' ? parseFloat(value) || 0 : value
        };
        debouncedSaveDraft(updated);
        return updated;
      });
    },
    [debouncedSaveDraft]
  );

  // ... rest of the component
}
```

### Vue 3 Implementation

**`InterventionForm.vue`**
```vue
<template>
  <div class="intervention-form">
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <template v-if="!intervention">
      <button
        @click="createDraft"
        :disabled="isLoading"
        class="btn-primary"
      >
        {{ isLoading ? 'Creating...' : 'Add Intervention' }}
      </button>
    </template>

    <template v-else>
      <div class="form-group">
        <label>Intervention Name</label>
        <input
          v-model="intervention.name"
          type="text"
          placeholder="e.g., Cleaning"
          :disabled="intervention.status !== 'DRAFT'"
          @input="scheduleUpdate"
        />
      </div>

      <div class="form-group">
        <label>Price</label>
        <input
          v-model.number="intervention.price"
          type="number"
          step="0.01"
          min="0"
          :disabled="intervention.status !== 'DRAFT'"
          @input="scheduleUpdate"
        />
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea
          v-model="intervention.note"
          placeholder="Additional notes..."
          :disabled="intervention.status !== 'DRAFT'"
          @input="scheduleUpdate"
        />
      </div>

      <div class="form-actions">
        <span :class="`badge badge-${intervention.status.toLowerCase()}`">
          {{ intervention.status }}
        </span>

        <button
          v-if="intervention.status === 'DRAFT'"
          @click="finalize"
          :disabled="isLoading || !intervention.name.trim()"
          class="btn-success"
        >
          {{ isLoading ? 'Saving...' : 'Save Intervention' }}
        </button>

        <div v-else class="text-success">✓ Intervention saved</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Intervention {
  id: number | null;
  appointmentId: number;
  name: string;
  price: number;
  teeth: number[];
  note: string;
  status: 'DRAFT' | 'COMPLETED';
}

const props = defineProps<{ appointmentId: number }>();
const emit = defineEmits<{ saved: [Intervention] }>();

const intervention = ref<Intervention | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
let updateTimeout: NodeJS.Timeout;

const createDraft = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const response = await fetch(
      `/api/v1/appointments/${props.appointmentId}/interventions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          price: 0,
          teeth: [],
          note: ''
        })
      }
    );

    if (!response.ok) throw new Error('Failed to create draft');
    intervention.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const scheduleUpdate = () => {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    saveDraft();
  }, 2000); // 2 second debounce
};

const saveDraft = async () => {
  if (!intervention.value?.id || intervention.value.status !== 'DRAFT') return;

  try {
    const response = await fetch(
      `/api/v1/interventions/${intervention.value.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: intervention.value.name,
          price: intervention.value.price,
          teeth: intervention.value.teeth,
          note: intervention.value.note
        })
      }
    );

    if (!response.ok) throw new Error('Failed to save draft');
    intervention.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  }
};

const finalize = async () => {
  if (!intervention.value?.id) return;

  try {
    isLoading.value = true;
    error.value = null;

    const response = await fetch(
      `/api/v1/interventions/${intervention.value.id}/finalize`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: intervention.value.name.trim(),
          price: intervention.value.price,
          teeth: intervention.value.teeth,
          note: intervention.value.note
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to finalize');
    }

    const finalized = await response.json();
    intervention.value = finalized;
    emit('saved', finalized);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.intervention-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-draft {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-completed {
  background-color: #dcfce7;
  color: #166534;
}

input:disabled,
textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}
</style>
```

### Angular Implementation

**`intervention.service.ts`**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Intervention {
  id: number | null;
  appointmentId: number;
  name: string;
  price: number;
  teeth: number[];
  note: string;
  status: 'DRAFT' | 'COMPLETED';
}

@Injectable({ providedIn: 'root' })
export class InterventionService {
  constructor(private http: HttpClient) {}

  createDraft(appointmentId: number): Observable<Intervention> {
    return this.http
      .post<Intervention>(
        `/api/v1/appointments/${appointmentId}/interventions`,
        { name: '', price: 0, teeth: [], note: '' }
      )
      .pipe(catchError(err => throwError(() => new Error('Failed to create draft'))));
  }

  saveDraft(id: number, data: Partial<Intervention>): Observable<Intervention> {
    return this.http
      .put<Intervention>(`/api/v1/interventions/${id}`, data)
      .pipe(catchError(err => throwError(() => new Error('Failed to save draft'))));
  }

  finalize(id: number, data: Partial<Intervention>): Observable<Intervention> {
    return this.http
      .post<Intervention>(`/api/v1/interventions/${id}/finalize`, data)
      .pipe(catchError(err => throwError(() => new Error('Failed to finalize'))));
  }
}
```

**`intervention-form.component.ts`**
```typescript
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { InterventionService, Intervention } from './intervention.service';

@Component({
  selector: 'app-intervention-form',
  template: `
    <div class="intervention-form">
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>

      <ng-container *ngIf="!intervention">
        <button
          (click)="createDraft()"
          [disabled]="isLoading"
          class="btn-primary"
        >
          {{ isLoading ? 'Creating...' : 'Add Intervention' }}
        </button>
      </ng-container>

      <form *ngIf="intervention && form" [formGroup]="form" class="intervention-form-group">
        <div class="form-group">
          <label>Intervention Name</label>
          <input
            type="text"
            formControlName="name"
            placeholder="e.g., Cleaning"
            [disabled]="intervention.status !== 'DRAFT'"
          />
        </div>

        <div class="form-group">
          <label>Price</label>
          <input
            type="number"
            formControlName="price"
            step="0.01"
            min="0"
            [disabled]="intervention.status !== 'DRAFT'"
          />
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea
            formControlName="note"
            placeholder="Additional notes..."
            [disabled]="intervention.status !== 'DRAFT'"
          ></textarea>
        </div>

        <div class="form-actions">
          <span [class]="'badge badge-' + intervention.status.toLowerCase()">
            {{ intervention.status }}
          </span>

          <button
            *ngIf="intervention.status === 'DRAFT'"
            (click)="finalize()"
            [disabled]="isLoading || !form.valid"
            class="btn-success"
          >
            {{ isLoading ? 'Saving...' : 'Save Intervention' }}
          </button>

          <div *ngIf="intervention.status === 'COMPLETED'" class="text-success">
            ✓ Intervention saved
          </div>
        </div>
      </form>
    </div>
  `
})
export class InterventionFormComponent implements OnInit, OnDestroy {
  @Input() appointmentId!: number;
  @Output() saved = new EventEmitter<Intervention>();

  form: FormGroup;
  intervention: Intervention | null = null;
  isLoading = false;
  error: string | null = null;

  private formValueChanges$ = new Subject<void>();
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private interventionService: InterventionService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      note: [''],
      teeth: [[]]
    });
  }

  ngOnInit(): void {
    // Subscribe to form changes with 2-second debounce
    this.subscriptions.add(
      this.formValueChanges$
        .pipe(debounceTime(2000), distinctUntilChanged())
        .subscribe(() => this.saveDraft())
    );

    // Emit form changes
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        this.formValueChanges$.next();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createDraft(): void {
    this.isLoading = true;
    this.error = null;

    this.subscriptions.add(
      this.interventionService.createDraft(this.appointmentId).subscribe({
        next: (draft) => {
          this.intervention = draft;
          this.form.patchValue({
            name: draft.name,
            price: draft.price,
            note: draft.note,
            teeth: draft.teeth
          });
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to create draft';
          this.isLoading = false;
        }
      })
    );
  }

  saveDraft(): void {
    if (!this.intervention?.id || this.intervention.status !== 'DRAFT') return;

    const data = {
      name: this.form.get('name')?.value || '',
      price: this.form.get('price')?.value || 0,
      note: this.form.get('note')?.value || '',
      teeth: this.form.get('teeth')?.value || []
    };

    this.subscriptions.add(
      this.interventionService.saveDraft(this.intervention.id, data).subscribe({
        next: (updated) => {
          this.intervention = updated;
        },
        error: (err) => {
          this.error = 'Failed to save draft';
        }
      })
    );
  }

  finalize(): void {
    if (!this.intervention?.id || !this.form.valid) return;

    this.isLoading = true;
    this.error = null;

    const data = {
      name: this.form.get('name')?.value?.trim() || '',
      price: this.form.get('price')?.value || 0,
      note: this.form.get('note')?.value || '',
      teeth: this.form.get('teeth')?.value || []
    };

    this.subscriptions.add(
      this.interventionService.finalize(this.intervention.id, data).subscribe({
        next: (finalized) => {
          this.intervention = finalized;
          this.saved.emit(finalized);
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to finalize intervention';
          this.isLoading = false;
        }
      })
    );
  }
}
```

---

## CSS Styles (For All Frameworks)

**`intervention-form.css`**
```css
.intervention-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 500px;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #fff;
}

.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.badge {
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-draft {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-completed {
  background-color: #dcfce7;
  color: #166534;
}

/* Button Styles */
.btn-primary,
.btn-success {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
  box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);
}

.btn-primary:disabled,
.btn-success:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Alert Styles */
.alert {
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.alert-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.text-success {
  color: #16a34a;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

---

## Key Implementation Points

### ✅ Do's
- ✅ Create draft on button click (with empty/zero values)
- ✅ Use 2-second debounce for input changes
- ✅ Call the PUT endpoint for draft updates (not POST)
- ✅ Call the POST `/finalize` endpoint to finalize
- ✅ Display status badge (DRAFT or COMPLETED)
- ✅ Disable inputs when status is COMPLETED
- ✅ Show loading state during API calls
- ✅ Handle validation errors gracefully

### ❌ Don'ts
- ❌ Don't send API requests on every keystroke (causes server load)
- ❌ Don't create intervention on every button click (use draft instead)
- ❌ Don't finalize without validating name and price
- ❌ Don't forget to debounce input changes
- ❌ Don't allow editing COMPLETED interventions

---

## Testing Checklist

- [ ] Click "Add Intervention" creates a DRAFT with empty values
- [ ] Status badge shows "DRAFT"
- [ ] Type in name/price/note fields
- [ ] Wait 2 seconds after last keystroke
- [ ] Verify only ONE API call was made (debounced)
- [ ] Verify the draft was updated on the backend
- [ ] Click "Save Intervention" finalizes the intervention
- [ ] Status changes to "COMPLETED"
- [ ] Inputs become disabled
- [ ] Deleting a draft still works
- [ ] API errors are displayed to the user

---

## Integration with Appointment View

When displaying interventions for an appointment, filter or display differently based on status:

```typescript
// Show only completed interventions in the list
const completedInterventions = interventions.filter(i => i.status === 'COMPLETED');

// Show draft as editable form (in-place editing)
const draftIntervention = interventions.find(i => i.status === 'DRAFT');
```

---

## Related Backend Documentation

See `INTERVENTION_DRAFT_WORKFLOW.md` for complete backend API details and database changes.


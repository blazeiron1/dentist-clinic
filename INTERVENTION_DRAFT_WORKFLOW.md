# Intervention Management - Draft and Finalization Process

## Overview
The intervention management system has been updated to support a **draft-and-finalize** workflow. This prevents interventions from being prematurely saved and reduces unnecessary API calls.

## Workflow

### 1. Create a Draft Intervention
When the user clicks the "Add Intervention" button, a DRAFT intervention is created:

**Request:**
```
POST /api/v1/appointments/{appointmentId}/interventions
Content-Type: application/json

{
  "name": "",          // Can be empty initially
  "price": 0,          // Can be zero initially
  "teeth": [],         // Optional
  "note": ""           // Optional
}
```

**Response:**
```json
{
  "id": 123,
  "appointmentId": 456,
  "catalogId": null,
  "name": "",
  "price": 0,
  "paidAmount": 0,
  "outstanding": 0,
  "note": "",
  "performedAt": "2026-05-30T12:00:00Z",
  "teeth": [],
  "status": "DRAFT"     // NEW: Indicates this is a draft
}
```

### 2. Update Draft Intervention (with Debouncing)
As the user types in the intervention details, send updates with a **2-second debounce delay**:

**Request:**
```
PUT /api/v1/interventions/{id}
Content-Type: application/json

{
  "name": "Cleaning",
  "price": 50.00,
  "teeth": [11, 12],
  "note": "Regular cleaning"
}
```

**Response:** Updated intervention DTO with status still "DRAFT"

### 3. Finalize the Draft
When the user confirms/saves the intervention, call the finalize endpoint:

**Request:**
```
POST /api/v1/interventions/{id}/finalize
Content-Type: application/json

{
  "name": "Cleaning",           // Must not be empty
  "price": 50.00,               // Must be positive
  "teeth": [11, 12],            // Optional
  "note": "Regular cleaning"    // Optional
}
```

**Response:**
```json
{
  "id": 123,
  "appointmentId": 456,
  "catalogId": 789,
  "name": "Cleaning",
  "price": 50.00,
  "paidAmount": 0,
  "outstanding": 50.00,
  "note": "Regular cleaning",
  "performedAt": "2026-05-30T12:00:00Z",
  "teeth": [11, 12],
  "status": "COMPLETED"   // NEW: Status changed to COMPLETED
}
```

**Errors:**
- `400 Bad Request` - If name is blank or price is not positive
- `400 Bad Request` - If trying to finalize a non-draft intervention
- `404 Not Found` - If intervention ID doesn't exist

## Frontend Implementation Tips

### React Example with Debouncing

```javascript
import { useCallback } from 'react';
import { debounce } from 'lodash'; // or use your own debounce implementation

function InterventionEditor({ appointmentId, initialDraftId }) {
  const [intervention, setIntervention] = useState(null);
  const [isDraft, setIsDraft] = useState(!!initialDraftId);

  // Debounced update function (2 seconds)
  const debouncedUpdate = useCallback(
    debounce(async (data) => {
      if (!intervention?.id) return;
      
      try {
        const response = await fetch(`/api/v1/interventions/${intervention.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const updated = await response.json();
        setIntervention(updated);
      } catch (error) {
        console.error('Failed to update intervention:', error);
      }
    }, 2000),
    [intervention?.id]
  );

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...intervention, [name]: value };
    setIntervention(newData);
    debouncedUpdate(newData);
  };

  // Create draft on mount or button click
  const createDraft = async () => {
    try {
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
      const draft = await response.json();
      setIntervention(draft);
      setIsDraft(true);
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
  };

  // Finalize intervention
  const finalize = async () => {
    if (!intervention?.id) return;
    
    try {
      const response = await fetch(
        `/api/v1/interventions/${intervention.id}/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: intervention.name,
            price: intervention.price,
            teeth: intervention.teeth,
            note: intervention.note
          })
        }
      );
      if (response.ok) {
        const finalized = await response.json();
        setIntervention(finalized);
        setIsDraft(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to finalize'}`);
      }
    } catch (error) {
      console.error('Failed to finalize intervention:', error);
    }
  };

  if (!intervention) {
    return <button onClick={createDraft}>Add Intervention</button>;
  }

  return (
    <div>
      <input
        name="name"
        value={intervention.name}
        onChange={handleChange}
        placeholder="Intervention name"
      />
      <input
        name="price"
        type="number"
        value={intervention.price}
        onChange={handleChange}
        placeholder="Price"
      />
      {isDraft && (
        <>
          <span className="status-badge draft">DRAFT</span>
          <button onClick={finalize}>Save Intervention</button>
        </>
      )}
      {!isDraft && (
        <span className="status-badge completed">COMPLETED</span>
      )}
    </div>
  );
}

// Debounce implementation (if not using lodash)
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
```

## Database Changes

A new migration `V3__add_intervention_status.sql` was added to:
1. Add a `status` column to the `intervention` table (default: 'DRAFT')
2. Create an index on `(appointment_id, status)` for efficient draft queries

## Key Benefits

✅ **No Premature Saves** - Interventions start as drafts and only become permanent after finalization
✅ **Reduced API Calls** - Debouncing prevents API calls on every keystroke
✅ **Better UX** - Users can see the status (DRAFT vs COMPLETED) and know when changes are pending
✅ **Flexible** - Users can still update drafts before finalizing
✅ **Data Integrity** - Finalization validates required fields (name, price)

## Migration Notes

After deploying these changes:
1. Run Flyway migrations (automatic on startup)
2. Existing interventions will be marked as COMPLETED (default migration behavior)
3. No data loss - the new status column is backward compatible


# Security Specification - EZ English

## 1. Data Invariants
- A `Session` must belong to the user identified by `userId`.
- Users can only read and write their own profile and sessions.
- `uid` in the profile must match the authenticated user ID.
- `createdAt` and `timestamp` are immutable after creation.
- `score` and `metrics` must be within valid ranges (0-100).

## 2. The Dirty Dozen Payloads

### P1: Identity Spoofing (Write other user's profile)
Attempt to create/update `/users/victim-uid` as `attacker-uid`.
**Expected: PERMISSION_DENIED**

### P2: Privilege Escalation (Set own points to infinity)
Update own profile with `points: 9999999`.
**Expected: PERMISSION_DENIED (or restricted by validation rules)**

### P3: Orphaned Session
Create a session in `/users/my-uid/sessions/id` with `userId: "other-uid"`.
**Expected: PERMISSION_DENIED**

### P4: ID Poisoning (Long ID)
Create `/users/` + ('A' * 2000).
**Expected: PERMISSION_DENIED**

### P5: Field Injection (Shadow field)
Add `isAdmin: true` to a Session document.
**Expected: PERMISSION_DENIED**

### P6: Type Poisoning (String for Score)
Set `score: "one hundred"` in a Session.
**Expected: PERMISSION_DENIED**

### P7: Boundary Break (Score > 100)
Set `score: 101` in a Session.
**Expected: PERMISSION_DENIED**

### P8: Immutable Violation (Change createdAt)
Update a profile with a new `createdAt` timestamp.
**Expected: PERMISSION_DENIED**

### P9: Unauthorized Read (Victim's History)
Read `/users/victim-uid/sessions/session-id` as `attacker`.
**Expected: PERMISSION_DENIED**

### P10: Session Stealing (Move session to self)
Try to update a session's `userId` in another user's collection (though subcollection structure prevents this naturally, testing for robustness).
**Expected: PERMISSION_DENIED**

### P11: Malicious Markdown (Oversized feedback)
Inject 2MB of text into the `feedback` field.
**Expected: PERMISSION_DENIED (Size enforcement)**

### P12: Prompt Injection / System Field Spoofing
User tries to write to a "System" field if we had one (e.g., `aiAuditPass: true`).
**Expected: PERMISSION_DENIED**

## 3. Test Runner
We will use rules tests to verify these constraints.

# Security Specification - MatatuMind

## Data Invariants
1. `mobility_signals` must have a valid `type` and `severity`.
2. `routes_intel` can only be updated by the system (authenticated AI service) - for now we'll allow authenticated users to view, and only admins (or a service account) to write, but in our simplified model, we'll allow any authenticated user to report signals.
3. Timestamps must be server-validated.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Empty Signal**: `{}` -> Denied (Missing required fields)
2. **Invalid Severity**: `{ "type": "traffic", "severity": "deadly" }` -> Denied
3. **Future Signal**: `{ "timestamp": "2030-01-01..." }` -> Denied (Server time check)
4. **Spoofed ID**: User A tries to delete User B's signal -> Denied
5. **Route Hijack**: User tries to overwrite AI route logic with garbage -> Denied
6. **Huge Message**: `{ "message": "A" * 10000 }` -> Denied (Size limit)
7. **Junk ID**: Creating a signal with path `/mobility_signals/!!!$$$!!!` -> Denied (ID pattern)
8. **Anom Admin**: Anonymous user trying to write to `routes_intel` -> Denied
9. **No Auth**: Unauthenticated user writing anything -> Denied
10. **Partial Signal**: `{ "type": "traffic" }` (Missing message) -> Denied
11. **Type Injection**: `{ "type": { "admin": true } }` -> Denied (Type check)
12. **Signal Spam**: Rapid fire writing (limited by rules if possible, but definitely schema must match)

## Test Environment
I will implement `firestore.rules` and verify them.

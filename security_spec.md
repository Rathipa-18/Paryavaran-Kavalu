# Security Specification - Paryavaran-Kavalu

## Data Invariants
1. A report must have a valid `reportedBy` UID matching the authenticated user.
2. A user can only modify their own profile, except for `ecoKarma` which is updated via report/cleanup actions (logic handled in rules).
3. Once a report is marked as `Cleaned`, its `status` cannot be reverted to `Pending`.
4. Only whitelisted fields can be updated during report cleanup.

## The Dirty Dozen Payloads (Rejection Expected)
1. **Identity Spoofing**: User A tries to create a report with `reportedBy: "UserB"`.
2. **Resource Poisoning**: Lat/Lng outside valid range or junk strings.
3. **Ghost Fields**: Adding `isAdmin: true` to a user profile.
4. **State Skip**: Marking a report as `Cleaned` during creation.
5. **Unauthorized Update**: User A trying to update User B's report description.
6. **Self-Reward**: User A updating their own `ecoKarma` without a valid action.
7. **Invalid Type**: Sending a string for `lat` instead of a number.
8. **PII Leak**: Guest user trying to read all user emails (if we had them, we use `displayName` only).
9. **Status Reversal**: Trying to update a 'Cleaned' report back to 'Pending'.
10. **Shadow Field**: Adding a 'verified' field to a report that doesn't exist in schema.
11. **Spoofed Name**: User A reporting as "Prime Minister".
12. **Orphaned Write**: Creating a report for a project that doesn't exist (n/a here, but good practice).

## The Test Runner
A `firestore.rules.test.ts` would verify these, but since I can't run tests here easily, I'll focus on the rules implementation.

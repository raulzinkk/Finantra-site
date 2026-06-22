# Firestore Security Rules Specification

This document details the security specification, invariants, and test payloads designed to verify the security of the Firestore rules.

## 1. Data Invariants

1. **Transaction Integrity**:
   - A transaction document can only be created by an authenticated user, and its `userId` field must match the creator's UID.
   - The transaction amount must be a number greater than or equal to 0.
   - The transaction `type` must be either `earnings` or `expenses`.
   - Modifying `userId` or `createdAt` after creation is forbidden (immutability).

2. **Monthly Bills Integrity**:
   - Only the authenticated owner of the bill can read or write it.
   - The `amount` must be a valid number >= 0.
   - The `isPaid` field must be a boolean.

3. **Investment Integrity**:
   - Only the authenticated owner can access, create, or update the investment.
   - `amountInvested` and `currentAmount` must be valid numbers >= 0.

4. **Catch-All Default Deny**:
   - All unspecified collections or documents default to deny access.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific malicious payloads designed to attempt to break our security invariants. All of these must return `PERMISSION_DENIED`:

### Payload 1: Identity Spoofing (Create Transaction for Target User)
Attempting to force-assign a transaction to another user's account.
```json
{
  "id": "tx_spoof1",
  "userId": "another_user_id_123",
  "profileId": "p_12345",
  "type": "earnings",
  "description": "Premium Cheat Income",
  "amount": 99999,
  "category": "Salário",
  "date": "2026-06-22",
  "paymentMethod": "Pix"
}
```

### Payload 2: Write WITHOUT Authentication
Attempting to create a monthly bill with no user logged in.
```json
{
  "id": "bill_no_auth",
  "userId": null,
  "description": "Hack Bill",
  "amount": 500,
  "dueDate": "2026-06-30",
  "category": "Lazer",
  "isPaid": false,
  "profileId": "p_default"
}
```

### Payload 3: Value Poisoning (Massive Size Injection in Description)
Attempting to write a transaction description exceeding safety limit of 500 characters.
```json
{
  "id": "tx_poison1",
  "userId": "victim_uid_555",
  "profileId": "p_555",
  "type": "expenses",
  "description": "<A repeated string of characters totaling 10,000 bytes or 1MB payload to cause server-side memory exhaustion>",
  "amount": 5.0,
  "category": "Alimentação",
  "date": "2026-06-22"
}
```

### Payload 4: Invalid Enum Type (Spoofing Transaction Type)
Attempting to write an invalid type field (not 'earnings' or 'expenses').
```json
{
  "id": "tx_bad_type",
  "userId": "attacker_uid_111",
  "profileId": "p_111",
  "type": "free_money_glitch",
  "description": "Hacked Type",
  "amount": 100,
  "category": "Outros",
  "date": "2026-06-22"
}
```

### Payload 5: Negative Value Injection
Attempting to set a negative expense amount to invert balance calculation.
```json
{
  "id": "tx_negative_amount",
  "userId": "attacker_uid_111",
  "profileId": "p_111",
  "type": "expenses",
  "description": "Backdoor Refund",
  "amount": -50000,
  "category": "Alimentação",
  "date": "2026-06-22",
  "paymentMethod": "Cartão"
}
```

### Payload 6: Modifying Creator ID (Privilege Escalation on Update)
Attempting to modify the `userId` in an existing transaction to transfer ownership.
```json
{
  "id": "tx_existing_99",
  "userId": "hijacked_user_333",
  "profileId": "p_99",
  "type": "expenses"
}
```

### Payload 7: Modifying Immutable createdAt Timestamp
Updating `createdAt` from a previously saved value.
```json
{
  "id": "tx_existing_99",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Payload 8: Wrong Type on Investment yieldRate
Injecting a non-numeric/string type into investment `yieldRate`.
```json
{
  "id": "inv_bad_yield",
  "userId": "attacker_uid_111",
  "profileId": "p_111",
  "name": "Super Fund",
  "type": "Ações",
  "amountInvested": 1000,
  "currentAmount": 1200,
  "yieldRate": "NotANumberHacker",
  "acquisitionDate": "2026-06-22",
  "broker": "FinantraBroker"
}
```

### Payload 9: Invalid Document Path Poisoning
Attempting to write to a document with an extremely large malicious ID containing special chars.
```json
{
  "id": "extreme_id_poisoning_payload_containing_escaped_characters_and_excessive_length_xxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Payload 10: State Locking Bypass (Modify Bill Status When Locked)
Attempting to modify protected fields when status is terminal.
```json
{
  "id": "bill_locked_1",
  "amount": 999999
}
```

### Payload 11: Bulk Read Scraping (No Relational userId Filter in Query)
Attempting an unconstrained search without using `where("userId", "==", auth.uid)` filter. This should be rejected by the rules list pattern.
```json
"SELECT * FROM transactions" (via client-side query)
```

### Payload 12: Anonymous/Unverified Spoofed Email Domain Write
Attempting to sign in with an unverified email structure or bypassing verification flags.
```json
{
  "userId": "unverified_user_999",
  "email_verified": false
}
```

---

## 3. Test Runner Structure (Reference)

A dry-run test suite (like `firestore.rules.test.ts`) would assert:
1. `firebase.assertSucceeds(...)` for owners reading/writing correct schemas.
2. `firebase.assertFails(...)` for all of the "Dirty Dozen" cases.

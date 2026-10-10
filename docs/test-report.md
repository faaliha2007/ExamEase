# Automated Test Execution Report
**Assessment:** College Software Engineering SAT II Assessment  
**Test Suite:** `server/tests/assessment.test.js`  
**Execution Engine:** Vitest 2.1.9, Supertest 7.0.0, Node.js v24.12.0  
**Database:** MongoDB 7.0 (Local Windows Service on port 27017)  
**Execution Timestamp:** 2026-10-10 12:25:36 UTC  

---

## 1. Executive Summary

All twelve mandatory assessment test cases (`T1` through `T12`) and all six Create Slot feature test cases were executed in isolated test databases (`examease_assessment_test_db` and `examease_create_slot_test_db`). **100% of test cases passed without defects or skips.**

| Metric | Value |
| :--- | :--- |
| **Total Test Suites** | 2 (`assessment.test.js`, `createSlot.test.js`) |
| **Total Test Cases** | 18 |
| **Passed** | 18 |
| **Failed** | 0 |
| **Skipped** | 0 |
| **Pass Rate** | **100.0%** |
| **Execution Duration** | 4.64 seconds |
| **Database Transactions / Atomic Writes** | Verified Concurrency Safe |

---

## 2. Test Execution Results Matrix

| Test ID | Linked FR & BR | Preconditions & Inputs | Expected Result | Actual Result | Status | Evidence Log |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | FR3, FR4<br>BR2, BR7 | Resource `R101` (10 seats). Two separate bookings of 2 and 3 seats. | Two distinct reservations, availability decremented to 5. | Two unique booking references generated; remaining capacity = 5. | **PASS** | `tests/assessment.test.js:L93` |
| **T2** | FR4<br>BR1 | Resource `R103` (20 seats). Quantities 0, 1, 5, 6, 1.5. | Reject 0, 6, 1.5 with HTTP 400. Accept 1 and 5 with HTTP 201. | Quantities 0, 6, 1.5 rejected with HTTP 400 without coercion. 1 and 5 accepted. | **PASS** | `tests/assessment.test.js:L148` |
| **T3** | FR3, FR4<br>BR2, BR6 | Resource `R104` with availability 0. Request 1 seat. | HTTP 409 Conflict; 0 reservations created; capacity remains 0. | HTTP 409 returned; zero records created; availability stayed 0. | **PASS** | `tests/assessment.test.js:L196` |
| **T4** | FR4<br>BR4 | Base amounts ₹999, ₹1,000, ₹1,001. | Booking charges ₹50, ₹0, ₹0 respectively. | ₹999 -> charge ₹50; ₹1000 -> charge ₹0; ₹1001 -> charge ₹0. Safe arithmetic verified. | **PASS** | `tests/assessment.test.js:L230` |
| **T5** | FR4, FR5<br>BR3, BR4, BR7 | Resource `R105` (rate ₹1,000, 3 seats). Book 2 seats. | Unique ref `EXM-XXXXXX`, CONFIRMED, snapshot ₹2000, capacity 1, 1 history item. | Ref created, status CONFIRMED, fare snapshot ₹2000, capacity = 1, history record logged. | **PASS** | `tests/assessment.test.js:L248` |
| **T6** | FR4<br>BR5, BR6 | Inputs with blank name and 9-digit phone. | HTTP 400; zero reservations; capacity untouched; 0 history items. | HTTP 400 returned for both cases; zero reservations; capacity unchanged. | **PASS** | `tests/assessment.test.js:L305` |
| **T7** | FR3, FR4<br>BR2, BR6, BR7 | Resource `R102` (5 seats). Req 1 takes 4 seats. Req 2 requests 2 seats. | Req 2 rejected with HTTP 409; capacity remains 1. | Stale request rejected with HTTP 409; capacity remained exactly 1. | **PASS** | `tests/assessment.test.js:L359` |
| **T8** | FR6, FR8, FR10<br>BR8, BR10 | User 2 creates booking. User 1 attempts view, cancel, and admin advance. | All three User 1 requests rejected with HTTP 403 Forbidden. | HTTP 403 returned on all 3 cross-user access attempts; booking remained intact. | **PASS** | `tests/assessment.test.js:L402` |
| **T9** | FR8, FR9<br>BR8 | Admin attempts skip (`CONFIRMED → COMPLETED`), then valid progression. | Skip rejected (HTTP 400). Valid step-by-step approved (HTTP 200). Terminal rejected. | Stage skipping rejected; valid progression confirmed; terminal state protected. | **PASS** | `tests/assessment.test.js:L452` |
| **T10** | FR6<br>BR9 | User cancels eligible booking once, then repeats cancellation. | 1st cancel restores capacity once. 2nd cancel rejected; no extra capacity added. | 1st cancel restored 2 seats; 2nd cancel returned HTTP 400 without double capacity restoration. | **PASS** | `tests/assessment.test.js:L512` |
| **T11** | FR5<br>BR7 | Confirmed booking created. Database connection dropped and reconnected. | Reservation and fare item persist identically. | Disconnect & reconnect verified; reservation and snapshot queried intact. | **PASS** | `tests/assessment.test.js:L557` |
| **T12** | FR4, FR7<br>BR3, BR4 | Booking created at ₹499. Admin updates catalog rate to ₹850. | Historical booking saved rate and grand total remain ₹499 and ₹1,048. | Catalog rate updated to ₹850; historical reservation snapshot remained ₹499 / ₹1,048. | **PASS** | `tests/assessment.test.js:L593` |

---

## 3. Raw Console Execution Log

```
> examease-server@1.0.0 test
> vitest run --reporter=verbose

 RUN  v2.1.9 D:/download/OnlineExam/server

stdout | tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12)
[MongoDB] Connected to 127.0.0.1/examease_assessment_test_db

 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T1: Select the same resource twice and verify no incorrect duplicate record or unintended capacity update occurs
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T2: Test quantities 0, 1, 5, 6, and 1.5; accept only valid integer boundary values (1 and 5)
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T3: Attempt to book R104 with availability 0; reject without booking or capacity change
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T4: Test base amounts ₹999, ₹1,000, and ₹1,001; verify charges ₹50, ₹0, and ₹0
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T5: Make one valid booking and verify unique reference, CONFIRMED status, fare snapshot, reduced capacity, and initial history
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T6: Submit missing or invalid booking details; verify no reservation, no history, and no capacity change
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T7: Slot capacity consumed before confirmation; stale request rejected without partial updates
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T8: Verify User 1 cannot view or cancel User 2's booking and cannot advance operational statuses
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T9: Verify valid administrator status progression and rejection of skipped, repeated, or terminal transitions
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T10: Cancel an eligible booking, verify capacity restoration once, and confirm second cancellation fails
stdout | tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T11: Verify database persistence after disconnecting and reconnecting to MongoDB
[MongoDB] Disconnected
[MongoDB] Connected to 127.0.0.1/examease_assessment_test_db

 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T11: Verify database persistence after disconnecting and reconnecting to MongoDB
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T12: Change a resource's rate after booking and verify historical booking's saved rate and total remain unchanged
[MongoDB] Disconnected

## 3. Create Examination Slot Feature Test Results Matrix

| Test Objective | Inputs & Scenarios | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Slot Creation** | Slot ID: `R106`, Name: Exam Slot F, Capacity: 12, Rate: ₹750, Date: 2026-11-15 | Status 201; Resource and Schedule persisted in MongoDB | Resource and Schedule created in MongoDB with status ACTIVE | **PASS** |
| **Auto-Suggest Next Slot ID** | Existing slots: R101–R105 | Endpoint returns `R106` | Returns `{ nextSlotId: 'R106' }` | **PASS** |
| **Input Validation** | Missing name, capacity 0, capacity -5, decimal 7.5, fee -100, missing date | Status 400 Bad Request with validation errors | Rejected with HTTP 400 and descriptive validation messages | **PASS** |
| **Duplicate Slot ID** | Slot ID: `R101` (already exists) | Status 409 Conflict | Rejected with HTTP 409: "already exists" | **PASS** |
| **Role Authorization** | Unauthenticated (no token) / Candidate (role: `USER`) | HTTP 401 Unauthorized / HTTP 403 Forbidden | Unauthenticated returned 401; candidate returned 403 | **PASS** |
| **Student Booking & Capacity** | Student books 2 seats on new `R106` (initial 5 seats). Overbooking attempt for 4 seats. | Booking succeeds (201); capacity decrements to 3; overbooking rejected (409) | Student booked successfully; capacity became 3; overbooking rejected with 409 | **PASS** |

---

## 4. Raw Console Execution Log (All Test Suites)

```
> examease-server@1.0.0 test
> vitest run --reporter=verbose

 RUN  v2.1.9 D:/download/OnlineExam/server

stdout | tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature
[MongoDB] Connected to 127.0.0.1/examease_create_slot_test_db

stdout | tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12)
[MongoDB] Connected to 127.0.0.1/examease_assessment_test_db

 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should allow an Administrator to create a new examination slot with permanent MongoDB persistence 387ms
 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should auto-suggest the next unique Slot ID (e.g. R106)
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T1: Select the same resource twice and verify no incorrect duplicate record or unintended capacity update occurs 541ms
 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should reject slot creation when required fields are missing or invalid
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T2: Test quantities 0, 1, 5, 6, and 1.5; accept only valid integer boundary values (1 and 5)
 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should reject creation if the Slot ID already exists (duplicate key)
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T3: Attempt to book R104 with availability 0; reject without booking or capacity change
 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should reject unauthorized attempts to create examination slots
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T4: Test base amounts ₹999, ₹1,000, and ₹1,001; verify charges ₹50, ₹0, and ₹0
 ✓ tests/createSlot.test.js > Admin Portal — Create Examination Slot Feature > should make newly created slot available on Explore Slots and allow a student to register successfully
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T5: Make one valid booking and verify unique reference, CONFIRMED status, fare snapshot, reduced capacity, and initial history
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T6: Submit missing or invalid booking details; verify no reservation, no history, and no capacity change
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T7: Slot capacity consumed before confirmation; stale request rejected without partial updates
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T8: Verify User 1 cannot view or cancel User 2's booking and cannot advance operational statuses
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T9: Verify valid administrator status progression and rejection of skipped, repeated, or terminal transitions
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T10: Cancel an eligible booking, verify capacity restoration once, and confirm second cancellation fails
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T11: Verify database persistence after disconnecting and reconnecting to MongoDB
 ✓ tests/assessment.test.js > SAT II Assessment Test Suite (T1 - T12) > T12: Change a resource's rate after booking and verify historical booking's saved rate and total remain unchanged

 Test Files  2 passed (2)
      Tests  18 passed (18)
   Start at  12:49:49
   Duration  4.64s
```

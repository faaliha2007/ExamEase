# Requirement Analysis Document
**Project:** ExamEase — Online Examination Registration System (MERN Stack)  
**Assessment:** College Software Engineering SAT II Practical Assessment  
**Version:** 1.0.0 (Production Candidate)  
**Date:** October 2026  

---

## 1. Problem Summary

Academic institutions require a deterministic, high-integrity platform for candidates to discover and reserve accredited examination slots. Traditional systems frequently suffer from:
1. **Overselling & Race Conditions:** Concurrent candidate requests submitting at peak hours inadvertently oversell fixed physical or proctored room capacity.
2. **Volatile Historical Records:** Retroactive price or schedule changes recalculating past booking totals, compromising financial reconciliation.
3. **Weak Operational Auditing:** Lack of role-based lifecycle progression and absence of immutable state audit trails.

**ExamEase** solves these challenges by providing a full-stack, transactional examination registration system with real-time capacity checks, strict 10-digit candidate identity validation, atomic reservation confirmation, immutable fare snapshotting, role-based isolation, and administrator operational state progression.

---

## 2. Stakeholders & Actors

The system explicitly defines and restricts access to **exactly two human actors**:

| Actor | Description | Privileges & Responsibilities |
| :--- | :--- | :--- |
| **User (Candidate)** | A verified student/candidate registering for an examination session. | • Browse active examination slots and schedules.<br>• Filter by category and search by slot ID or name.<br>• Select integer quantities (1 to 5 seats).<br>• View real-time price breakdowns before payment.<br>• Confirm reservation atomically.<br>• Inspect private booking dockets and saved receipts.<br>• Cancel owned CONFIRMED bookings and restore seat capacity. |
| **Administrator (Controller)** | An authorized academic examination officer / controller. | • Monitor global registration transactions.<br>• Search and filter across all candidate dockets.<br>• Inspect fare snapshots and complete status audit histories.<br>• Advance operational status strictly (`CONFIRMED → CHECKED_IN or BOARDED → COMPLETED`).<br>• Enforce terminal states (`COMPLETED`, `CANCELLED`).<br>• Adjust base slot rates without modifying historical bookings. |

---

## 3. Functional Requirements (FR1 – FR10)

* **FR1 — Authentication & Identity Enforcement:** The system must provide role-based authentication (`USER`, `ADMIN`) with signed session tokens. The backend must independently enforce identity and permissions; client-supplied user IDs or role claims must never be trusted without cryptographic validation.
* **FR2 — Slot Exploration & Catalog Browsing:** The system must list examination slots with their unique identifier (e.g. `R101`), title, category, unit rate (INR ₹), and real-time remaining capacity.
* **FR3 — Search & Multi-Criteria Filtering:** Candidates and administrators must be able to search slots by identifier or title, and filter by technical category and availability state.
* **FR4 — Interactive Stepper Booking:** The candidate must complete a 4-step stepper (`Select Slot → Enter Details → Review Fare → Confirmed`) with live validation of candidate name, 10-digit phone number, roll number/identity, exam date, and seat quantity (1 to 5).
* **FR5 — Atomic Booking Confirmation:** Upon confirmation, the backend must atomically re-verify availability, decrement seat capacity, snapshot the current rate, calculate the fare, persist the reservation and reservation item, and generate the initial status history entry.
* **FR6 — Candidate Cancellation Workflow:** A candidate must be able to cancel an owned reservation if and only if its status is `CONFIRMED`. Cancellation must set the status to `CANCELLED`, replenish reserved capacity exactly once, and log the event.
* **FR7 — Private Booking Dossier & Fare Snapshot:** Candidates must be able to view their private booking details and fare snapshot. Historical bookings must remain completely immutable even if catalog resource rates change.
* **FR8 — Administrator Operations Dashboard:** The administrator must be able to view all system bookings, search by candidate or reference, filter by operational status, and inspect system-wide capacity and revenue counters.
* **FR9 — Operational Status Advancement:** The administrator must be able to transition reservations through the verified lifecycle (`CONFIRMED → CHECKED_IN or BOARDED → COMPLETED`). Stage skipping, terminal state transitions, and unauthorized alterations must be rejected.
* **FR10 — Access Control & Data Isolation:** Candidates must be strictly quarantined to their own reservations (`user1` cannot inspect or cancel `user2`'s bookings). Administrative endpoints must return HTTP 403 Forbidden to non-admin tokens.

---

## 4. Non-Functional Requirements (NFRs)

* **NFR1 — Concurrency & Data Integrity:** Database updates to capacity must execute atomically via conditional queries (`$gte` and `$inc`) or MongoDB replica-set transactions. Overselling under concurrent load is prohibited.
* **NFR2 — Precision & Safe Currency Calculations:** All currency values must use safe monetary arithmetic avoiding floating-point rounding errors. Currency must display as INR using the ₹ symbol with two decimal places.
* **NFR3 — Security & Input Sanitization:** Passwords must be hashed using `bcrypt` (work factor 10). REST APIs must validate all payloads, strip internal stack traces, and return standard HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500).
* **NFR4 — Usability & Responsive UI/UX:** The interface must implement an academic-professional aesthetic with warm off-white background (`#fbfbfa`), deep navy typography, royal blue primary actions, accessible contrast, mobile-friendly navigation, and clear loading/empty/error states.
* **NFR5 — Performance & Testability:** Automated test suites must execute independently without manual test steps. All test fixtures must run in dedicated test databases without mutating development state.

---

## 5. Exact Business Rules (BR1 – BR10)

| Rule ID | Rule Title | Formal Specification & Enforcement Location |
| :--- | :--- | :--- |
| **BR1** | Quantity Boundaries | Accept only integer quantities from 1 through 5. Reject 0, negative values, decimals, missing values, and values > 5. No silent truncation or coercion. Enforced in `bookingValidator.js` and `bookingService.js`. |
| **BR2** | Real-Time Availability | Only `ACTIVE` resources with sufficient current availability may be booked. Availability is rechecked at confirmation. Selecting a slot does not reserve capacity. Concurrency-safe atomic updates prevent overselling. |
| **BR3** | Fare Snapshotting | Use the active resource rate at the exact moment of confirmation. Persist unit rate, base amount, booking charge, and grand total in `ReservationItem`. Future rate edits must never alter historical records. |
| **BR4** | Monetary Calculation | `baseAmount = currentRate × quantity`.<br>`bookingCharge = 50` when `baseAmount < 1000`; otherwise `0`.<br>`grandTotal = baseAmount + bookingCharge`. Booking charge is evaluated on base amount, not final total. Safe decimal handling. |
| **BR5** | Required Details Validation | Candidate Name cannot be blank. Phone must contain exactly 10 digits (`/^\d{10}$/`). Booking date and candidate identity reference (roll number) are compulsory. Malformed requests are rejected with HTTP 400. |
| **BR6** | Failed Confirmation Safety | If validation fails or capacity is exhausted, reject request immediately (HTTP 400/409). No booking record, no capacity deduction, and no partial status history record may be created. |
| **BR7** | Successful Confirmation Atomicity | Generate one unique reference (`EXM-XXXXXX`). Create one `CONFIRMED` reservation, snapshot fare items, reduce availability, and write initial status history atomically. Rollback on any failure. |
| **BR8** | Status Progression State Machine | Initial status: `CONFIRMED`. Allowed transitions: `CONFIRMED → CHECKED_IN or BOARDED → COMPLETED`. Only Administrator can advance operational status. Skipping stages is prohibited. `COMPLETED` and `CANCELLED` are terminal. |
| **BR9** | Cancellation Integrity | Only the booking owner may cancel a `CONFIRMED` booking. Status becomes `CANCELLED`. Restores reserved capacity exactly once. Atomic status update, capacity replenish, and audit history log. Repeated cancellation is rejected. Non-confirmed bookings cannot be cancelled. |
| **BR10** | Access Control & Ownership | Candidates may view and cancel only their own bookings. Non-owners and non-admins receive HTTP 403 Forbidden. Only administrators can advance operational status or access global statistics. |

---

## 6. Scope & Assumptions

### In-Scope
1. Complete MERN full-stack application (React 19 Vite frontend, Node.js/Express API, MongoDB persistence).
2. Seed dataset containing the exact five specified resources (`R101`–`R105`) and three demo accounts (`user1`, `user2`, `admin`).
3. Automated test suite validating test cases `T1` through `T12`.
4. Two formal UML deliverables (Use Case Diagram and Class Diagram in PlantUML).
5. Comprehensive documentation: schema, architecture, test cases, test report, defect log, and AI usage report.

### Out-of-Scope & Assumptions
1. Real external payment gateways (Stripe, Razorpay) are omitted in accordance with SAT II academic assessment rules; simulated fare settlement is used.
2. Production email delivery servers (SMTP) are simulated via audit logs and instant screen receipts.
3. Schedule slots and categories are realistic synthetic demo values clearly labeled as demo data.

---

## 7. Acceptance Criteria

1. **AC-1:** Candidate can log in using demo selector (`user1` / `user2`), choose an active slot with capacity, select quantity 1–5, enter 10-digit phone, review fare, and obtain confirmed reference.
2. **AC-2:** Attempting to book `R104` (capacity 0) or requesting quantity exceeding capacity fails with clear error and zero database mutation.
3. **AC-3:** Base amounts < ₹1,000 incur ₹50 booking charge; base amounts ≥ ₹1,000 incur ₹0.
4. **AC-4:** Candidate can cancel only owned `CONFIRMED` bookings; cancellation replenishes seat capacity once. Repeated cancellations are rejected.
5. **AC-5:** `user1` cannot view `user2`'s booking details via direct URL or API call.
6. **AC-6:** Administrator can log in, view all registrations, and transition status step-by-step (`CONFIRMED → CHECKED_IN → COMPLETED`). Skipping stages is rejected.
7. **AC-7:** Database changes persist across server and database restarts.
8. **AC-8:** Modifying a slot's rate via admin controls leaves existing booking fare snapshots unchanged.
9. **AC-9:** All 12 automated assessment test cases pass with zero failures.

---

## 8. Requirements Traceability Matrix (RTM)

| FR ID | BR ID | Use Case Name | Responsible Class / Service | Test Case ID | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR1** | BR10 | UC1: Authenticate with Demo Account | `User`, `AuthController` | T8 | Passed |
| **FR2** | BR2 | UC2: Explore Examination Slots | `Resource`, `AvailabilityService` | T1, T3 | Passed |
| **FR3** | BR2 | UC3: Filter and Search Slots | `Resource`, `AvailabilityService` | T3 | Passed |
| **FR4** | BR1, BR4, BR5 | UC4: Configure Seat Quantity & Candidate Details | `bookingValidator`, `ReservationItem` | T2, T4, T6 | Passed |
| **FR5** | BR2, BR3, BR6, BR7 | UC5: Confirm Reservation Atomically | `BookingService`, `Reservation`, `AvailabilityService` | T1, T5, T7, T11 | Passed |
| **FR6** | BR9, BR10 | UC6: Cancel Confirmed Reservation | `BookingService`, `AvailabilityService`, `Reservation` | T8, T10 | Passed |
| **FR7** | BR3, BR10 | UC7: Inspect Dossier & Fare Snapshot | `Reservation`, `ReservationItem`, `BookingStatusHistory` | T5, T8, T12 | Passed |
| **FR8** | BR10 | UC8: Monitor Global Registrations | `AdminController`, `BookingService` | T8, T9 | Passed |
| **FR9** | BR8, BR10 | UC9: Advance Operational Status | `BookingService`, `statusValidator`, `BookingStatusHistory` | T8, T9 | Passed |
| **FR10** | BR10 | UC10: Enforce Authorization & Data Isolation | `authMiddleware`, `BookingService` | T8 | Passed |

# ExamEase — Online Examination Registration System

ExamEase is an assessment-grade, full-stack examination registration and capacity management web application built with the **MERN Stack** (MongoDB, Express.js, React 19, Node.js) for the college **Software Engineering SAT II** assessment.

The platform provides deterministic seat reservation, strict candidate validation, atomic transaction handling, immutable fare snapshotting, role-based authorization, and an administrator operational state machine.

---

## 1. System Features & Business Rules Overview

* **BR1 — Integer Quantities (1 to 5):** Strict integer boundaries; rejects zero, negative numbers, missing values, and decimals without silent coercion.
* **BR2 — Real-Time Availability & Concurrency:** Validates active capacity upon selection and re-verifies atomically upon confirmation to prevent overselling.
* **BR3 — Immutable Fare Snapshot:** Snapshots the exact resource rate at confirmation time; future catalog rate adjustments never alter historical bookings.
* **BR4 — Safe Monetary Calculations:**
  - `baseAmount = currentRate × quantity`
  - `bookingCharge = 50` when `baseAmount < 1000`; otherwise `0`
  - `grandTotal = baseAmount + bookingCharge`
  - Displayed in Indian Rupee (INR) with the `₹` symbol and two decimal places.
* **BR5 — Strict Candidate Validation:** Candidate name cannot be blank; phone number must be exactly 10 digits (`/^\d{10}$/`); candidate roll number and exam date are required.
* **BR6 — Atomic Safety on Failure:** Any validation failure or capacity race cleanly rejects the request with zero partial writes or capacity loss.
* **BR7 — Atomic Confirmation:** Generates a unique booking reference (`EXM-XXXXXX`), sets status to `CONFIRMED`, snapshots fare details, decrements capacity, and creates the initial audit history item atomically.
* **BR8 — Operational State Machine:** Progression strictly follows `CONFIRMED → CHECKED_IN or BOARDED → COMPLETED`. Skipping stages is prohibited; `COMPLETED` and `CANCELLED` are terminal.
* **BR9 — Safe Cancellation Workflow:** Only the owner of a `CONFIRMED` booking may cancel it. Cancellation sets status to `CANCELLED`, replenishes capacity exactly once, and logs the event. Repeated cancellation is rejected.
* **BR10 — Role-Based Access Control:** Strict isolation between candidate accounts; administrative controls restricted to verified administrator tokens.

---

## 2. Synthetic Demo Accounts

All credentials are encrypted using `bcrypt` (10 rounds) and seeded automatically into MongoDB:

| Account | Role | Synthetic Email | Demo Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate 1** | `USER` | `user1@examease.demo` | `DemoUser123!` | Standard candidate booking & cancellation testing |
| **Candidate 2** | `USER` | `user2@examease.demo` | `DemoUser123!` | Multi-user data isolation testing |
| **Exam Controller** | `ADMIN`| `admin@examease.demo` | `DemoAdmin123!` | Global docket inspection & operational status progression |

> **Note:** Demo authentication issues an HMAC-SHA256 signed JSON Web Token (JWT). Role and ownership authorization are strictly enforced by backend middleware on every request.

---

## 3. Seed Resources (Exact Specification)

| ID | Name | Category | Rate (INR) | Initial Availability | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R101** | Exam Slot A | Computer Science & Engineering SAT II | ₹499.00 | 10 | ACTIVE |
| **R102** | Exam Slot B | Advanced Data Structures & Algorithms SAT II | ₹799.00 | 5 | ACTIVE |
| **R103** | Exam Slot C | General Engineering Aptitude SAT II | ₹199.00 | 20 | ACTIVE |
| **R104** | Exam Slot D | Full-Stack Software Architecture SAT II | ₹1299.00 | 0 (Sold Out) | ACTIVE |
| **R105** | Exam Slot E | Database Systems & Cloud Engineering SAT II | ₹1000.00 | 3 | ACTIVE |

---

## 4. Prerequisites

1. **Node.js:** v18.0.0 or higher (Tested on Node.js v24.12.0)
2. **npm:** v9.0.0 or higher (Tested on npm 11.6.2)
3. **MongoDB:** MongoDB Server running locally on `localhost:27017` (e.g. Windows MongoDB Service or MongoDB Community Edition).

---

## 5. Installation & Setup Instructions

### Step 1: Install Dependencies
From the repository root directory, run:
```bash
npm run install:all
```
*(Or install individually: `cd server && npm install`, then `cd ../client && npm install`)*

### Step 2: Environment Configuration
Configuration files are provided in `server/.env` and `.env.example`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/examease_db
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/examease_test_db
JWT_SECRET=examease_super_secure_demo_jwt_secret_key_2026
CLIENT_URL=http://localhost:5173
```

### Step 3: Seed Database (Idempotent)
Populate the exact required resources, schedules, and demo users:
```bash
npm run seed
```
*Re-running `npm run seed` is completely idempotent and will preserve existing bookings and current availability.*

If you wish to wipe test bookings and restore initial pristine capacities:
```bash
npm run reset
```

---

## 6. Running the Application

### Option A: Run Both Services Concurrently
From the project root:
```bash
npm run dev:server
```
In a second terminal:
```bash
npm run dev:client
```

* Backend API: `http://localhost:5000`
* Frontend App: `http://localhost:5173`
* Health Check: `http://localhost:5000/api/health`

---

## 7. Automated Test Suite Execution (T1 – T12)

Execute the 12 comprehensive assessment integration test cases using Vitest:
```bash
npm run test
```
*(Or from the `server/` directory: `npm test`)*

### Test Suite Summary:
* **T1:** Select same resource twice (no incorrect duplicate record, capacity decremented correctly).
* **T2:** Boundary quantities 0, 1, 5, 6, 1.5 (accept only 1 and 5 without decimal coercion).
* **T3:** Attempt to book `R104` with 0 availability (rejected with HTTP 409).
* **T4:** Base amounts ₹999, ₹1,000, ₹1,001 (charges ₹50, ₹0, ₹0 respectively).
* **T5:** Single confirmed booking dossier (unique reference, `CONFIRMED`, fare snapshot, capacity decremented, initial history).
* **T6:** Missing or invalid candidate details (rejected with HTTP 400; zero database mutations).
* **T7:** Stale concurrency race (second request rejected; no overselling).
* **T8:** Access control isolation (User 1 blocked from User 2's booking with HTTP 403).
* **T9:** Administrator status progression (stage skipping rejected; sequential progression approved).
* **T10:** Cancellation capacity restoration (restored once; second cancellation rejected).
* **T11:** Database persistence across connection resets.
* **T12:** Historical fare immutability (catalog rate change leaves existing booking snapshots intact).

**Current Test Result:** 12 Passed, 0 Failed (100% Pass Rate).

---

## 8. Interactive Evaluation Walkthrough

1. **Landing Page:** Open `http://localhost:5173`. Notice the hero heading *"Your next milestone starts here."*, the live slot capacity preview, and the 3-step workflow.
2. **Demo Login:** Click **Demo Access** or go to `http://localhost:5173/login`. Select **Candidate (USER)** and click **Alice Johnson (Candidate 1)**.
3. **Explore Slots:** Browse the slots grid on `/dashboard`. Observe that `R104` displays *Sold Out* while `R101` shows active availability.
4. **4-Step Stepper Booking:**
   - Step 1: Select `R101` and choose quantity `2`.
   - Step 2: Validate name, 10-digit phone number (`9876543210`), and student ID.
   - Step 3: Review fare breakdown: ₹499 × 2 = ₹998 base amount + ₹50 administrative fee (< ₹1,000) = ₹1,048 grand total.
   - Step 4: Click **Confirm & Book Reservation** to receive your unique booking reference (e.g. `EXM-ABC123`).
5. **My Bookings & Cancellation:**
   - Go to **My Bookings** (`/my-bookings`) to view your confirmed reservation.
   - Click **Cancel** on a `CONFIRMED` booking. Confirm the modal dialog.
   - The status updates to `CANCELLED` and seat capacity is immediately restored in the catalog.
6. **Administrator Operational Processing:**
   - Use the **Demo Switcher** in the top navigation bar to switch to **Dr. Evelyn Vance (ADMIN)**.
   - Open `/admin` (Administrator Operations Portal).
   - View global registrations, search by candidate, and inspect revenue statistics.
   - Click **Process** on a booking docket. Advance status step-by-step: `CONFIRMED → CHECKED_IN → COMPLETED`. Observe that stage skipping is prevented.

---

## 9. Deliverables Directory Map

* **`docs/requirement-analysis.md`:** Problem summary, actors, FR1–FR10, NFRs, BR1–BR10, scope, assumptions, acceptance criteria, and traceability matrix.
* **`docs/uml/use-case-diagram.puml`:** PlantUML Use Case Diagram with User and Administrator actors.
* **`docs/uml/class-diagram.puml`:** PlantUML Class Diagram covering all models, services, attributes, operations, and relationships.
* **`docs/database-schema.md`:** Detailed MongoDB collections, schemas, indexes, and validation rules.
* **`docs/architecture.md`:** Layered architecture, security model, dual-mode concurrency strategy, and finite state machine.
* **`docs/test-cases.md`:** Detailed specifications for tests T1 through T12.
* **`docs/test-report.md`:** Actual test execution log with 100% pass verification.
* **`docs/defect-log.md`:** Defect discovery and resolution log during development.
* **`docs/ai-usage-report.md`:** AI-assisted engineering methodology, prompt log, corrections, and limitations.
* **`server/tests/assessment.test.js`:** Executable automated integration tests.

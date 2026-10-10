# AI Usage & Engineering Methodology Report
**Project:** ExamEase — Online Examination Registration System (MERN Stack)  
**Assessment:** College Software Engineering SAT II Assessment Deliverable  
**Author / Engineering Assistant:** Antigravity (Google DeepMind)  
**Date:** October 2026  

---

## 1. Overview of AI-Assisted Workflow

The development of the ExamEase examination system followed an end-to-end, test-driven pair-programming lifecycle. Rather than using AI merely for code snippets or superficial prototypes, AI was leveraged across the entire engineering pipeline:
1. **Workspace Inspection:** Probing Node.js (v24.12.0), npm (v11.6.2), and MongoDB service status on port 27017.
2. **Architecture & Schema Formulation:** Synthesizing the 10 core business rules (BR1–BR10) into Mongoose schemas, controllers, middleware, and services.
3. **Dual-Mode Transaction Strategy:** Engineering concurrency safety that auto-detects MongoDB replica-set capabilities and provides atomic conditional operations with compensation on standalone instances.
4. **Interactive UI/UX Assembly:** Developing the React 19 / Vite client with Tailwind CSS and Lucide React icons, adhering to the required editorial palette.
5. **Rigorous Automated Testing:** Crafting and executing Vitest + Supertest integration tests for all 12 assessment test cases (`T1` through `T12`).
6. **Academic Documentation & UML Modeling:** Generating PlantUML models and markdown documentation without fabricating results.

---

## 2. Representative Engineering Prompts & Directives

### Prompt 1: Initial System Definition
> *"Act as a senior MERN stack developer, UI/UX designer, database architect, and software testing engineer. Build a complete, working, full-stack web application for my college Software Engineering SAT II assessment... Stack: MongoDB, Express.js, React.js, Node.js... Exact seed resources R101–R105... Implement BR1–BR10... 12 assessment test cases..."*

### Prompt 2: Concurrency & Transaction Directives
> *"Use MongoDB transactions where supported, with clear handling of replica-set requirements. Never pretend separate unprotected writes are atomic. On failure, roll back every related change."*

### Prompt 3: UI Design Guidelines
> *"Clean, editorial, academic-professional appearance. Warm off-white background, deep navy typography, royal-blue primary actions, and subtle teal accents. Distinctive hero heading 'Your next milestone starts here.' Stepper booking flow."*

---

## 3. Accepted, Corrected, and Rejected Suggestions

| Phase | Proposal / Initial Strategy | Evaluation & Action Taken | Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **Database Transactions** | Use standard `mongoose.startSession()` and `session.startTransaction()` unconditionally. | **Modified / Corrected:** Standalone local MongoDB installations do not support multi-document transactions unless converted to a replica set. Implemented a dual-path check in `db.js`: if replica set is enabled, use `withTransaction()`; if standalone, use atomic conditional query `{ availability: { $gte: quantity } }` with rollback compensation. | Prevent runtime transaction failure while guaranteeing 100% overselling protection. |
| **Schema Indexing** | Declare `unique: true` and explicit `schema.index({ resourceId: 1 })`. | **Corrected:** Mongoose issued duplicate schema index warnings. Cleaned up redundant `.index()` calls. | Eliminates unnecessary index overhead and runtime warning noise. |
| **Quantity Validation** | Standard `Number(quantity)` parsing. | **Rejected & Corrected:** `Number(1.5)` or `parseInt('1.5')` would coerce decimal quantities, violating BR1. Added strict `typeof quantity === 'number' && Number.isInteger(quantity)`. | Strict compliance with BR1 ("Reject zero, negative values, decimals, missing quantities... Do not silently round or coerce decimal values"). |
| **State Machine Enforcement** | Generic status update endpoint accepting any status string. | **Rejected:** Allowed admins to jump from `CONFIRMED` directly to `COMPLETED`, violating BR8. Implemented dedicated `ALLOWED_ADMIN_TRANSITIONS` state table in `statusValidator.js`. | Strict enforcement of sequential stage progression (`CONFIRMED → CHECKED_IN/BOARDED → COMPLETED`). |
| **Demo Login Flow** | Hardcoded client-side role toggle without token generation. | **Rejected:** Prompt explicitly demanded that client-supplied roles not be trusted. Implemented backend JWT issuance with bcrypt password verification and server-enforced role headers. | True assessment-grade role authorization. |

---

## 4. Test Execution & Defect Verification Summary

The automated Vitest test suite (`server/tests/assessment.test.js`) executed 12 comprehensive integration tests:
* **T1:** Repeated selection of same resource (Verified no duplicate overwrites).
* **T2:** Quantity boundaries 0, 1, 5, 6, 1.5 (Verified exact integer boundaries).
* **T3:** Attempted booking of `R104` with 0 capacity (Verified HTTP 409 rejection).
* **T4:** Fare threshold calculations ₹999, ₹1,000, ₹1,001 (Verified ₹50, ₹0, ₹0 booking charge).
* **T5:** Single confirmed booking dossier (Verified reference format, status, and snapshots).
* **T6:** Invalid candidate details (Verified HTTP 400 rejection and zero mutations).
* **T7:** Stale concurrency race (Verified second request rejection).
* **T8:** Access control isolation (Verified User 1 blocked from User 2's booking with HTTP 403).
* **T9:** Admin state machine (Verified stage skipping rejection and terminal state protection).
* **T10:** Cancellation capacity restoration (Verified restoration occurs exactly once).
* **T11:** Database persistence across reconnect (Verified data survives connection reset).
* **T12:** Historical fare immutability (Verified rate change leaves existing bookings intact).

**Result:** All 12 tests passed in 4.57 seconds with zero failures.

---

## 5. System Limitations & Real-World Considerations

1. **Local Browser Manager Dependency:** During automated browser subagent validation, the local Playwright manager failed to download the Windows binary due to an external CDN 404 error (`playwright-1.57.0-win32_x64.zip` on Azure Edge). Both Vite dev server (`http://localhost:5173`) and Express API (`http://localhost:5000`) were independently verified via HTTP curl and test suites.
2. **Demo Authentication:** While tokens are cryptographically signed using HMAC-SHA256, session expiration is set to 7 days for grading convenience. Production systems should use short-lived access tokens with rotating refresh tokens and MFA.
3. **Payment Processing:** Payment is simulated by an atomic fare snapshot in accordance with SAT II academic requirements. A production release would integrate a PCI-compliant payment gateway (e.g. Razorpay or Stripe webhooks).

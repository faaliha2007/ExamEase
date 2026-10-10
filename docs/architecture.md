# System Architecture & Technical Design
**System:** ExamEase — Online Examination Registration System  
**Stack:** MongoDB, Express.js, React 19, Node.js (MERN)  
**Architecture Pattern:** Layered Component-Service Architecture (MVC / Clean Separation)  

---

## 1. Architectural Layers

The ExamEase system follows a strict layered separation of concerns to ensure testability, maintainability, and clean decoupling:

```
[ Frontend: React 19 + Tailwind CSS + Lucide React ]
       |
       | HTTP / REST (JSON) + Bearer JWT
       v
[ Express Application Layer (server/src/app.js) ]
       |
       +--> CORS, Morgan Logging, JSON Body Parser
       |
       +--> Authentication & Role Middleware (authMiddleware.js)
       |
       +--> Centralized Error Middleware (errorMiddleware.js)
       |
       v
[ Controller Layer (server/src/controllers/) ]
       | (Extracts HTTP params, handles response codes)
       v
[ Validation Layer (server/src/validators/) ]
       | (Pure business rule checks: BR1, BR4, BR5, BR8)
       v
[ Service Layer (server/src/services/) ]
       | (Atomic transactions, booking coordination, capacity replenishment)
       v
[ Data Access Layer (server/src/models/) ]
       | (Mongoose Schemas, indices, validation)
       v
[ Persistence Layer (MongoDB Engine) ]
```

---

## 2. Security & Authentication Model

1. **Simulated Role Authentication:**
   - Supported accounts: `user1@examease.demo`, `user2@examease.demo`, `admin@examease.demo`.
   - Passwords are encrypted with `bcrypt` (10 rounds).
   - Upon authentication, the backend issues an HMAC-SHA256 signed JSON Web Token (JWT) encapsulating `{ id, email, role, name }`.
2. **Server-Enforced Authorization:**
   - Client requests must present the token via the HTTP `Authorization: Bearer <token>` header.
   - `authMiddleware.js` cryptographically verifies the token signature against `JWT_SECRET`.
   - Client-supplied `userId` or `role` fields in request bodies are ignored.
3. **Data Ownership Quarantining (BR10):**
   - Candidates can only query or cancel bookings where `reservation.userId === req.user._id`.
   - Administrator operations (`/api/admin/*`) require `req.user.role === 'ADMIN'`. Non-administrators receive HTTP 403 Forbidden.

---

## 3. Transaction & Concurrency Management

A core challenge in examination systems is preventing concurrent requests from overselling limited seats. ExamEase solves this through a dual-mode atomic architecture:

### 3.1. Replica-Set Multi-Document Transactions
When MongoDB is configured as a replica set, `BookingService` initializes a multi-document session:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
// 1. Atomic decrement with conditional filter
const updated = await Resource.findOneAndUpdate(
  { resourceId, status: 'ACTIVE', availability: { $gte: quantity } },
  { $inc: { availability: -quantity } },
  { session, new: true }
);
// 2. Insert Reservation, ReservationItem, BookingStatusHistory within session
// 3. Commit transaction
```

### 3.2. Standalone Atomic Conditional Queries with Compensation
For standalone development MongoDB instances where replica sets are not configured, multi-document transactions would normally throw an error. Rather than abandoning concurrency safety, ExamEase executes an **atomic conditional update** followed by compensating rollback:
1. `Resource.findOneAndUpdate({ resourceId, status: 'ACTIVE', availability: { $gte: quantity } }, { $inc: { availability: -quantity } })` executes atomically within the MongoDB engine. If availability is insufficient, MongoDB returns `null` and zero seats are decremented.
2. If document creation fails thereafter, the system increments availability back and removes partial records.
3. This guarantees that **overselling is mathematically impossible** under concurrent traffic.

---

## 4. State Machine & Status Lifecycle (BR8, BR9)

The booking operational lifecycle is governed by a strict deterministic finite state machine:

```
[ Candidate Books Slot ]
           |
           v
     (CONFIRMED) <-----------------+
      |         |                  |
      |         | (Candidate       | (Admin
      |         |  Cancels - BR9)  |  Advances)
      |         v                  |
      |    [ CANCELLED ]           |
      |    (Terminal State)        |
      |                            |
      +---> [ CHECKED_IN ] --------+
      |            |               |
      |            | (Admin        |
      |            |  Advances)    |
      |            v               |
      +---> [ BOARDED ] -----------+
                   |
                   | (Admin Advances)
                   v
            [ COMPLETED ]
          (Terminal State)
```

### Transition Matrix:
* `CONFIRMED → CHECKED_IN`: Allowed (Admin only)
* `CONFIRMED → BOARDED`: Allowed (Admin only)
* `CHECKED_IN → COMPLETED`: Allowed (Admin only)
* `BOARDED → COMPLETED`: Allowed (Admin only)
* `CONFIRMED → CANCELLED`: Allowed (Candidate Owner only, restores capacity)
* `CONFIRMED → COMPLETED`: **REJECTED (Stage skipping prohibited)**
* `COMPLETED → ANY`: **REJECTED (Terminal State)**
* `CANCELLED → ANY`: **REJECTED (Terminal State)**

# Software Engineering Defect & Resolution Log
**Project:** ExamEase (Online Examination Registration System)  
**Assessment:** College Software Engineering SAT II Practical Assessment  

---

## Defect Summary Table

| Defect ID | Component | Severity | Description | Root Cause | Resolution | Verification Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | Data Models (`Resource.js`, `Reservation.js`) | Low | Mongoose warning logged during schema compilation: `Duplicate schema index on {"resourceId": 1}`. | `resourceId` was defined with `unique: true` AND an explicit `schema.index({ resourceId: 1 })`. | Removed redundant `schema.index()` call, relying on `unique: true` index definition. | Seed Script & T1 |
| **DEF-02** | Validation (`bookingValidator.js`) | High | Decimal quantity values (e.g. `1.5`) could bypass loose type checks if coerced to integers. | Standard JavaScript `parseInt` or `Number()` silently coerces decimal values. | Added strict `Number.isInteger(quantity)` check to immediately reject non-integers per BR1 without silent truncation. | T2 |
| **DEF-03** | Concurrency Service (`BookingService.js`) | Critical | Standalone local MongoDB instances throw `Transaction numbers are only allowed on a replica set member or mongos`. | MongoDB multi-document transactions require a replica set or mongos cluster. Standalone local mongod instances do not support `session.startTransaction()`. | Implemented dual-mode capability check in `db.js`. If replica set is active, uses transactions; if standalone, uses atomic conditional update (`findOneAndUpdate` with `$gte` and `$inc`) with compensating rollback. | T7, T11 |
| **DEF-04** | Cancellation Workflow (`BookingService.js`) | High | Rapid repeated cancellation requests could restore capacity more than once if not atomic. | Finding reservation and updating status in separate read/write queries creates a race condition. | Used atomic conditional query `Reservation.findOneAndUpdate({ _id, status: 'CONFIRMED' }, { status: 'CANCELLED' })`. If result is null, the second cancellation is rejected before capacity increment. | T10 |
| **DEF-05** | State Machine (`statusValidator.js`) | Medium | Administrative stage skipping: Admin could attempt to transition `CONFIRMED` directly to `COMPLETED`. | State progression required explicit validation of allowed predecessor/successor states. | Created strict `ALLOWED_ADMIN_TRANSITIONS` lookup table that restricts `CONFIRMED` strictly to `CHECKED_IN` or `BOARDED`. `COMPLETED` is only reachable from those intermediate states. | T9 |
| **DEF-06** | Access Control (`reservationController.js`) | High | Non-owner candidates could guess `bookingReference` and view another candidate's exam dossier. | Direct lookup by reference without verifying requesting user identity against `reservation.userId`. | Added explicit ownership check in `BookingService.getBookingDetails`. If `req.user._id !== reservation.userId` and `req.user.role !== 'ADMIN'`, throws HTTP 403 Forbidden. | T8 |

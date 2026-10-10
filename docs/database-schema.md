# Database Schema Documentation
**Database System:** MongoDB 7+ / Mongoose ODM  
**Database Name:** `examease_db` (Development), `examease_test_db` (Testing)  
**Currency Standard:** Indian Rupee (INR, ₹)  

---

## 1. Schema Overview & Entity Relationship

ExamEase utilizes a normalized relational-style document schema built on MongoDB and validated via Mongoose. The database guarantees atomicity, immutable snapshots, and an audit trail.

```
+--------------------+            +------------------------+
|       User         | 1        * |      Reservation       |
|--------------------|------------|------------------------|
| _id                |            | _id                    |
| name               |            | bookingReference (UK)  |
| email (UK)         |            | userId (FK -> User)    |
| password (bcrypt)  |            | resourceId (FK)        |
| role (USER/ADMIN)  |            | status (ENUM)          |
| status (ACTIVE)    |            | candidateName          |
+--------------------+            | candidatePhone (10d)   |
                                  | candidateIdRef         |
                                  +------------------------+
                                        | 1          | 1
                                        |            |
                                        | 1          | *
                         +--------------------+   +-----------------------+
                         |  ReservationItem   |   | BookingStatusHistory  |
                         |--------------------|   |-----------------------|
                         | _id                |   | _id                   |
                         | reservationId (FK) |   | referenceId (INDEX)   |
                         | quantity (1-5)     |   | reservationId (FK)    |
                         | unitRateSnapshot   |   | actorId (FK -> User)  |
                         | baseAmount         |   | oldStatus             |
                         | bookingCharge (BR4)|   | newStatus             |
                         | grandTotal         |   | note                  |
                         +--------------------+   | eventAt (TIMESTAMP)   |
                                                  +-----------------------+
+--------------------+            +------------------------+
|      Resource      | 1        * |        Schedule        |
|--------------------|------------|------------------------|
| _id                |            | _id                    |
| resourceId (UK)    |            | scheduleId (UK)        |
| name               |            | resourceId (FK)        |
| category           |            | examDate               |
| rate (INR)         |            | startTime / endTime    |
| availability (INT) |            | venue                  |
| status (ACTIVE)    |            | isDemoData (TRUE)      |
+--------------------+            +------------------------+
```

---

## 2. Detailed Collections & Field Specifications

### 2.1. `users` Collection
Stores candidate and administrator profiles.

| Field | Type | Required | Unique | Indexed | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Yes | MongoDB Primary Key | System ID |
| `name` | String | Yes | No | No | Trimmed, non-empty | Candidate or Administrator Name |
| `email` | String | Yes | Yes | Yes | Lowercase, valid email regex | Login identifier |
| `password` | String | Yes | No | No | Min length 6 (stored as bcrypt hash) | Encrypted credential |
| `role` | String | Yes | No | No | Enum: `['USER', 'ADMIN']` | Access privilege tier |
| `status` | String | Yes | No | No | Enum: `['ACTIVE', 'INACTIVE']`, Default: `ACTIVE` | Account status |
| `createdAt` | Date | Auto | No | No | Timestamp | Account creation date |

---

### 2.2. `resources` Collection
Represents verified examination slots, fee rates, and available seat capacity.

| Field | Type | Required | Unique | Indexed | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Yes | Primary Key | System ID |
| `resourceId` | String | Yes | Yes | Yes | Uppercase, trimmed (e.g. `R101`) | Official slot code |
| `name` | String | Yes | No | No | Trimmed string | Display title (e.g. `Exam Slot A`) |
| `category` | String | Yes | No | No | Technical stream name | Engineering category |
| `rate` | Number | Yes | No | No | Min: `0`, INR currency | Fee rate per seat |
| `availability` | Number | Yes | No | Yes | Integer, Min: `0` | Available seats |
| `status` | String | Yes | No | Yes | Enum: `['ACTIVE', 'INACTIVE']` | Slot status |

---

### 2.3. `schedules` Collection
Maintains synthetic scheduling sessions for examination centers.

| Field | Type | Required | Unique | Indexed | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `scheduleId` | String | Yes | Yes | Yes | Unique string (e.g. `SCH-R101-01`) | Schedule reference |
| `resourceId` | String | Yes | No | Yes | Foreign Key -> `Resource.resourceId` | Associated slot code |
| `examDate` | String | Yes | No | No | Date format `YYYY-MM-DD` | Examination date |
| `startTime` | String | Yes | No | No | Time string (e.g. `09:00 AM`) | Session start |
| `endTime` | String | Yes | No | No | Time string (e.g. `12:00 PM`) | Session conclusion |
| `venue` | String | No | No | No | Room / Proctored URL | Center descriptor |
| `isDemoData` | Boolean| Yes | No | No | Always `true` for synthetic data | Demo label |

---

### 2.4. `reservations` Collection
Stores confirmed candidate bookings.

| Field | Type | Required | Unique | Indexed | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Yes | Yes | Primary Key | System ID |
| `bookingReference` | String | Yes | Yes | Yes | Uppercase alphanumeric (e.g. `EXM-ABC123`) | Unique tracking code |
| `userId` | ObjectId | Yes | No | Yes | Foreign Key -> `User._id` | Booking owner |
| `resourceId` | String | Yes | No | Yes | Foreign Key -> `Resource.resourceId` | Reserved slot code |
| `status` | String | Yes | No | Yes | Enum: `['CONFIRMED', 'CHECKED_IN', 'BOARDED', 'COMPLETED', 'CANCELLED']` | Lifecycle state |
| `bookingDate` | String | Yes | No | No | Date format `YYYY-MM-DD` | Exam date |
| `candidateName`| String | Yes | No | No | Non-blank string (BR5) | Candidate name |
| `candidatePhone`| String | Yes | No | No | Exact 10 digits regex `/^\d{10}$/` (BR5) | Contact number |
| `candidateIdRef`| String | Yes | No | No | Non-blank string (BR5) | Roll No / Student ID |

---

### 2.5. `reservationitems` Collection
Stores immutable financial snapshots and calculated charges for each booking.

| Field | Type | Required | Validation / Rules | Description |
| :--- | :--- | :--- | :--- | :--- |
| `reservationId` | ObjectId | Yes | Foreign Key -> `Reservation._id` | Target booking |
| `bookingReference`| String | Yes | Indexed reference copy | Tracking reference |
| `userId` | ObjectId | Yes | Foreign Key -> `User._id` | Candidate identifier |
| `resourceId` | String | Yes | Uppercase slot code | Resource code |
| `resourceRefSnapshot`| Object | Yes | `{ resourceId, name, category }` | Immutable catalog snapshot |
| `quantity` | Number | Yes | Integer only, `1 <= q <= 5` (BR1) | Reserved seat count |
| `unitRateSnapshot`| Number | Yes | Rate at confirmation time (BR3) | Per-seat unit fee |
| `baseAmount` | Number | Yes | `unitRateSnapshot × quantity` (BR4) | Base examination fee |
| `bookingCharge` | Number | Yes | `50` if base < 1000, else `0` (BR4) | Admin fee |
| `grandTotal` | Number | Yes | `baseAmount + bookingCharge` (BR4) | Final amount payable |

---

### 2.6. `bookingstatushistories` Collection
Immutable audit log tracking all operational events and state transitions.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `referenceId` | String | Yes | Indexed booking reference |
| `reservationId` | ObjectId | Yes | Foreign Key -> `Reservation._id` |
| `actorId` | ObjectId | Yes | Foreign Key -> `User._id` of initiator |
| `actorName` | String | Yes | Human-readable name of initiator |
| `actorRole` | String | Yes | Role (`USER`, `ADMIN`, `SYSTEM`) |
| `oldStatus` | String | No | Prior state (`null` for initial confirmation) |
| `newStatus` | String | Yes | Transitioned state |
| `note` | String | No | Context note (e.g. seat count, fee, actor) |
| `eventAt` | Date | Yes | Timestamp of the event |

---

## 3. Exact Seed Data Fixtures

```javascript
[
  { resourceId: 'R101', name: 'Exam Slot A', rate: 499,  availability: 10, status: 'ACTIVE' },
  { resourceId: 'R102', name: 'Exam Slot B', rate: 799,  availability: 5,  status: 'ACTIVE' },
  { resourceId: 'R103', name: 'Exam Slot C', rate: 199,  availability: 20, status: 'ACTIVE' },
  { resourceId: 'R104', name: 'Exam Slot D', rate: 1299, availability: 0,  status: 'ACTIVE' },
  { resourceId: 'R105', name: 'Exam Slot E', rate: 1000, availability: 3,  status: 'ACTIVE' }
]
```

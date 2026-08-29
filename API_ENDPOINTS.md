# Complete API Endpoints Specification

> **Societal Innovation Collaboration Portal - API Catalog**  
> Complete technical reference for all 19 REST endpoints across 8 functional modules.

---

## 📑 Module Index
1. [Auth Module (2 Endpoints)](#1-auth-module)
2. [Users Module (4 Endpoints)](#2-users-module)
3. [Challenges Module (5 Endpoints)](#3-challenges-module)
4. [Collaboration Module (5 Endpoints)](#4-collaboration-module)
5. [Notifications Module (3 Endpoints)](#5-notifications-module)
6. [Analytics Module (4 Endpoints)](#6-analytics-module)
7. [AI Subsystem Architecture](#7-ai-subsystem-architecture)
8. [Storage Subsystem Architecture](#8-storage-subsystem-architecture)

---

## 1. Auth Module

### 1.1 Register User
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/auth/signup`
- **Module**: `AuthModule`
- **Controller**: `AuthController.signup`
- **Purpose**: Register a new user profile with role assignment. Citizens are auto-verified; institutional accounts require administrative verification.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    email: string;        // required, valid email
    password: string;     // required, min 6 characters
    name: string;         // required, full name
    role: "citizen" | "pri_ulb_official" | "university_admin" | "faculty" | "student" | "industry_partner" | "govt_viewer" | "super_admin";
    org_id?: string;      // optional UUID of institution for university/faculty/student/industry
    district?: string;    // optional Jharkhand district
    contact?: string;     // optional phone number
  }
  ```
- **Response Schema**:
  ```typescript
  {
    statusCode: 201,
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        org_id: string | null;
        district: string | null;
        verified: boolean;
      },
      session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
      } | null
    },
    timestamp: string;
  }
  ```
- **Possible Error Responses**:
  - `400 Bad Request` (`AUTH_SIGNUP_FAILED`) - Email already registered or invalid fields.
  - `500 Internal Server Error` (`PROFILE_CREATION_FAILED`) - Database insert failure.
- **Example Request**:
  ```http
  POST /api/v1/auth/signup HTTP/1.1
  Content-Type: application/json

  {
    "email": "priya.sharma@example.com",
    "password": "SuperSecret123!",
    "name": "Priya Sharma",
    "role": "citizen",
    "district": "Ranchi",
    "contact": "+91 9876543210"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "user": {
        "id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
        "email": "priya.sharma@example.com",
        "name": "Priya Sharma",
        "role": "citizen",
        "org_id": null,
        "district": "Ranchi",
        "verified": true
      },
      "session": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "v1.mc83js...",
        "expires_at": 1756470000
      }
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 1.2 User Login
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/auth/login`
- **Module**: `AuthModule`
- **Controller**: `AuthController.login`
- **Purpose**: Authenticate user with email and password and return Supabase session JWT tokens.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    email: string;    // required
    password: string; // required
  }
  ```
- **Response Schema**:
  ```typescript
  {
    statusCode: 200,
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        org_id: string | null;
        district: string | null;
        verified: boolean;
      },
      session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
      }
    },
    timestamp: string;
  }
  ```
- **Possible Error Responses**:
  - `401 Unauthorized` (`INVALID_CREDENTIALS`) - Invalid email or password.
- **Example Request**:
  ```http
  POST /api/v1/auth/login HTTP/1.1
  Content-Type: application/json

  {
    "email": "priya.sharma@example.com",
    "password": "SuperSecret123!"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
        "email": "priya.sharma@example.com",
        "name": "Priya Sharma",
        "role": "citizen",
        "org_id": null,
        "district": "Ranchi",
        "verified": true
      },
      "session": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "v1.d8e9...",
        "expires_at": 1756473600
      }
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 2. Users Module

### 2.1 Get Current User Profile
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/users/me`
- **Module**: `UsersModule`
- **Controller**: `UsersController.getMyProfile`
- **Purpose**: Get current logged-in user profile, institution link, and verification status.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**: None
- **Response Schema**: User Profile object joined with `institutions(id, name, type, location, district)`
- **Possible Error Responses**:
  - `401 Unauthorized` (`UNAUTHORIZED`)
  - `404 Not Found` (`USER_NOT_FOUND`)
- **Example Request**:
  ```http
  GET /api/v1/users/me HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
      "name": "Prof. Amit Verma",
      "email": "amit.verma@bitsindri.ac.in",
      "role": "faculty",
      "org_id": "a1000000-0000-0000-0000-000000000001",
      "district": "Dhanbad",
      "contact": "+91 9835100000",
      "verified": true,
      "created_at": "2026-08-29T10:00:00.000Z",
      "institutions": {
        "id": "a1000000-0000-0000-0000-000000000001",
        "name": "Birsa Institute of Technology (BIT) Sindri",
        "type": "university",
        "location": "Dhanbad, Jharkhand",
        "district": "Dhanbad"
      }
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 2.2 Update Current User Profile
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/users/me`
- **Module**: `UsersModule`
- **Controller**: `UsersController.updateMyProfile`
- **Purpose**: Update editable profile information (name, contact phone, district).
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    name?: string;
    contact?: string;
    district?: string;
  }
  ```
- **Response Schema**: Updated User Profile object
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`PROFILE_UPDATE_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/users/me HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "contact": "+91 9876500000",
    "district": "Bokaro"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
      "name": "Priya Sharma",
      "email": "priya.sharma@example.com",
      "contact": "+91 9876500000",
      "district": "Bokaro",
      "verified": true
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 2.3 Verify Institutional Account
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/users/:id/verify`
- **Module**: `UsersModule`
- **Controller**: `UsersController.verifyUser`
- **Purpose**: Verify newly registered institutional accounts (Faculty, University Admins, Industry Partners).
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `super_admin`, `govt_viewer`
- **Path Parameters**:
  - `id` (string, UUID): Target user ID
- **Query Parameters**: None
- **Request Body Schema**: None
- **Response Schema**: Updated User object with `verified: true`
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden` (`FORBIDDEN_ACTION`) - Caller is not Super Admin or Govt.
  - `400 Bad Request` (`VERIFY_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/users/f8c0d2e8-1234-4a89-8012-9c8e7f654321/verify HTTP/1.1
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "f8c0d2e8-1234-4a89-8012-9c8e7f654321",
      "name": "Dr. Ramesh Singh",
      "role": "university_admin",
      "verified": true
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 2.4 List All Users
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/users`
- **Module**: `UsersModule`
- **Controller**: `UsersController.listUsers`
- **Purpose**: Query all registered users with optional role and district filters.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `super_admin`, `govt_viewer`, `pri_ulb_official`
- **Path Parameters**: None
- **Query Parameters**:
  - `role` (optional enum `UserRole`)
  - `district` (optional string)
- **Request Body Schema**: None
- **Response Schema**: Array of user records `User[]`
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `400 Bad Request` (`USERS_FETCH_FAILED`)
- **Example Request**:
  ```http
  GET /api/v1/users?role=faculty&district=Dhanbad HTTP/1.1
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
        "name": "Prof. Amit Verma",
        "email": "amit.verma@bitsindri.ac.in",
        "role": "faculty",
        "district": "Dhanbad",
        "verified": true,
        "created_at": "2026-08-29T10:00:00.000Z"
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 3. Challenges Module

### 3.1 Submit New Challenge
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/challenges`
- **Module**: `ChallengesModule`
- **Controller**: `ChallengesController.createChallenge`
- **Purpose**: Submit a new societal problem with automated AI classification, priority scoring, duplicate detection, and auto-routing to relevant universities. Supports optional file upload.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated user (`citizen`, `pri_ulb_official`, etc.)
- **Content-Type**: `multipart/form-data` or `application/json`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body / Form-Data Schema**:
  ```typescript
  {
    title: string;           // required, problem headline
    description: string;     // required, detailed issue description
    district: string;        // required, Jharkhand district (e.g. "Dumka", "Ranchi")
    location_text?: string;  // optional landmark/panchayat details
    latitude?: number;       // optional GPS latitude (-90 to 90)
    longitude?: number;      // optional GPS longitude (-180 to 180)
    media_urls?: string[];   // optional existing media URLs
    file?: File;             // optional file (image/doc) binary
  }
  ```
- **Response Schema**:
  ```typescript
  {
    statusCode: 201,
    data: {
      id: string;
      title: string;
      description: string;
      district: string;
      status: "submitted" | "routed";
      priority_score: number;
      category_id: string;
      assigned_institution_id: string | null;
      media_urls: string[];
      duplicate_of: string | null;
      ai_classification: {
        categorySlug: string;
        categoryName: string;
        priorityScore: number;
        recommendedKeywords: string[];
        duplicateCandidateId: string | null;
        duplicateSimilarityScore: number;
        rationale: string;
        providerUsed: string;
        processedAt: string;
      };
      created_at: string;
    },
    timestamp: string;
  }
  ```
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`CHALLENGE_CREATION_FAILED`)
- **Example Request**:
  ```http
  POST /api/v1/challenges HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "title": "Arsenic Contamination in Drinking Well at Kathikund",
    "description": "Over 200 households in Kathikund block are facing severe skin lesions due to high arsenic concentrations in local handpumps.",
    "district": "Dumka",
    "location_text": "Village Kathikund, Near Panchayat Bhavan",
    "latitude": 24.2694,
    "longitude": 87.2476
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "title": "Arsenic Contamination in Drinking Well at Kathikund",
      "description": "Over 200 households in Kathikund block...",
      "district": "Dumka",
      "status": "routed",
      "priority_score": 85,
      "category_id": "c1000000-0000-0000-0000-000000000004",
      "assigned_institution_id": "a1000000-0000-0000-0000-000000000001",
      "media_urls": [],
      "duplicate_of": null,
      "ai_classification": {
        "categorySlug": "water",
        "categoryName": "Water & Sanitation",
        "priorityScore": 85,
        "recommendedKeywords": ["drinking water", "arsenic", "handpump"],
        "duplicateCandidateId": null,
        "duplicateSimilarityScore": 0.0,
        "rationale": "High priority drinking water contamination impacting tribal block.",
        "providerUsed": "GemmaAPI (Google AI Studio)",
        "processedAt": "2026-08-29T11:45:00.000Z"
      },
      "created_at": "2026-08-29T11:45:00.000Z"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 3.2 List Challenges with Filters & Pagination
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/challenges`
- **Module**: `ChallengesModule`
- **Controller**: `ChallengesController.getChallenges`
- **Purpose**: Query paginated list of challenges with filters by status, district, category, institution, and full-text keyword search. Enforces Supabase Row-Level Security based on user role.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**: None
- **Query Parameters**:
  - `page` (optional int, default: `1`)
  - `limit` (optional int, default: `10`, max: `100`)
  - `status` (optional enum: `submitted`, `under_review`, `routed`, `team_formed`, `in_progress`, `completed`, `validated`, `rejected`)
  - `district` (optional string, e.g. `Dumka`, `Ranchi`)
  - `category_slug` (optional string, e.g. `water`, `agriculture`)
  - `category_id` (optional UUID)
  - `institution_id` (optional UUID)
  - `search` (optional search keyword in title or description)
- **Response Schema**:
  ```typescript
  {
    statusCode: 200,
    data: Challenge[],
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
    timestamp: string;
  }
  ```
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`CHALLENGES_QUERY_FAILED`)
- **Example Request**:
  ```http
  GET /api/v1/challenges?page=1&limit=10&status=routed&district=Dumka HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
        "title": "Arsenic Contamination in Drinking Well at Kathikund",
        "district": "Dumka",
        "status": "routed",
        "priority_score": 85,
        "created_at": "2026-08-29T11:45:00.000Z",
        "categories": {
          "id": "c1000000-0000-0000-0000-000000000004",
          "name": "Water & Sanitation",
          "slug": "water"
        },
        "institutions": {
          "id": "a1000000-0000-0000-0000-000000000001",
          "name": "Birsa Institute of Technology (BIT) Sindri",
          "district": "Dhanbad"
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 3.3 Get Challenge Details by ID
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/challenges/:id`
- **Module**: `ChallengesModule`
- **Controller**: `ChallengesController.getChallengeById`
- **Purpose**: Get comprehensive single challenge record, joined with submitter info, assigned university, active project teams, milestones, and industry proposals.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role (RLS applies)
- **Path Parameters**:
  - `id` (string, UUID): Challenge ID
- **Query Parameters**: None
- **Response Schema**: Full Challenge object with joined tables
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `404 Not Found` (`CHALLENGE_NOT_FOUND`)
- **Example Request**:
  ```http
  GET /api/v1/challenges/b3e0d2e8-4567-4a89-8012-9c8e7f123456 HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "title": "Arsenic Contamination in Drinking Well at Kathikund",
      "description": "Over 200 households in Kathikund block are facing severe health issues...",
      "district": "Dumka",
      "status": "routed",
      "priority_score": 85,
      "categories": { "name": "Water & Sanitation", "slug": "water" },
      "institutions": { "name": "Birsa Institute of Technology (BIT) Sindri" },
      "project_teams": [],
      "industry_engagements": []
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 3.4 Override AI Routing & Classification
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/challenges/:id/override-routing`
- **Module**: `ChallengesModule`
- **Controller**: `ChallengesController.overrideRouting`
- **Purpose**: Manually adjust AI assigned institution, category, or priority score.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `super_admin`, `govt_viewer`
- **Path Parameters**:
  - `id` (string, UUID): Challenge ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    override_reason: string;          // required justification
    category_id?: string;             // optional UUID
    assigned_institution_id?: string; // optional UUID
    priority_score?: number;          // optional 1-100
  }
  ```
- **Response Schema**: Updated challenge object with `adminOverride` audit trail
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden` (`FORBIDDEN_OVERRIDE`)
  - `404 Not Found` (`CHALLENGE_NOT_FOUND`)
  - `400 Bad Request` (`OVERRIDE_FAILED`)
- **Example Request**:
  ```http
  POST /api/v1/challenges/b3e0d2e8-4567-4a89-8012-9c8e7f123456/override-routing HTTP/1.1
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json

  {
    "assigned_institution_id": "a1000000-0000-0000-0000-000000000003",
    "priority_score": 95,
    "override_reason": "Re-routed to NIT Jamshedpur due to water electrodialysis laboratory."
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "assigned_institution_id": "a1000000-0000-0000-0000-000000000003",
      "priority_score": 95,
      "status": "routed"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 3.5 Update Challenge Lifecycle Status
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/challenges/:id/status`
- **Module**: `ChallengesModule`
- **Controller**: `ChallengesController.updateStatus`
- **Purpose**: Transition challenge through state machine. Validates role permissions and status transitions.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `super_admin`, `govt_viewer`, `university_admin`, `faculty`
- **Path Parameters**:
  - `id` (string, UUID): Challenge ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    status: "submitted" | "under_review" | "routed" | "team_formed" | "in_progress" | "completed" | "validated" | "rejected";
    notes?: string;
  }
  ```
- **Response Schema**: Updated challenge record
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`INVALID_STATE_TRANSITION` / `STATUS_UPDATE_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/challenges/b3e0d2e8-4567-4a89-8012-9c8e7f123456/status HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "status": "in_progress",
    "notes": "Field research and sample collection underway."
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "status": "in_progress"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 4. Collaboration Module

### 4.1 Form Project Team
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/collaboration/teams`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.formTeam`
- **Purpose**: Create university project execution team for a challenge. Automatically transitions challenge status to `team_formed`.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `university_admin`, `faculty`, `super_admin`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    challenge_id: string;    // required UUID
    university_id: string;   // required UUID
    faculty_ids?: string[];  // optional UUID array
    student_ids?: string[];  // optional UUID array
  }
  ```
- **Response Schema**: Created Team object joined with institution
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden` (`FORBIDDEN_INSTITUTION`) - Cannot form team for another institution.
  - `404 Not Found` (`CHALLENGE_NOT_FOUND`)
  - `400 Bad Request` (`TEAM_FORMATION_FAILED`)
- **Example Request**:
  ```http
  POST /api/v1/collaboration/teams HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
    "university_id": "a1000000-0000-0000-0000-000000000001",
    "faculty_ids": ["e7b0d2e8-4567-4a89-8012-9c8e7f123456"],
    "student_ids": ["f8b0d2e8-4567-4a89-8012-9c8e7f123456"]
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "d1e0d2e8-4567-4a89-8012-9c8e7f123456",
      "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "university_id": "a1000000-0000-0000-0000-000000000001",
      "status": "active",
      "faculty_ids": ["e7b0d2e8-4567-4a89-8012-9c8e7f123456"],
      "student_ids": ["f8b0d2e8-4567-4a89-8012-9c8e7f123456"],
      "created_at": "2026-08-29T11:45:00.000Z"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.2 Assign Team Members
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/collaboration/teams/:id/members`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.assignMembers`
- **Purpose**: Update faculty leaders and student contributors on a project team.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `university_admin`, `faculty`, `super_admin`
- **Path Parameters**:
  - `id` (string, UUID): Project Team ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    faculty_ids?: string[]; // optional UUID array
    student_ids?: string[]; // optional UUID array
  }
  ```
- **Response Schema**: Updated Team record
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `404 Not Found` (`TEAM_NOT_FOUND`)
  - `400 Bad Request` (`ASSIGN_MEMBERS_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/collaboration/teams/d1e0d2e8-4567-4a89-8012-9c8e7f123456/members HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "student_ids": [
      "f8b0d2e8-4567-4a89-8012-9c8e7f123456",
      "f9b0d2e8-4567-4a89-8012-9c8e7f123456"
    ]
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "d1e0d2e8-4567-4a89-8012-9c8e7f123456",
      "student_ids": [
        "f8b0d2e8-4567-4a89-8012-9c8e7f123456",
        "f9b0d2e8-4567-4a89-8012-9c8e7f123456"
      ]
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.3 Get Team by Challenge ID
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/collaboration/teams/challenge/:challengeId`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.getTeamByChallenge`
- **Purpose**: Retrieve team structure, faculty, students, institution details, and milestones for a given challenge.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**:
  - `challengeId` (string, UUID): Challenge ID
- **Query Parameters**: None
- **Response Schema**: Array of Project Teams with Milestones
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`TEAM_FETCH_FAILED`)
- **Example Request**:
  ```http
  GET /api/v1/collaboration/teams/challenge/b3e0d2e8-4567-4a89-8012-9c8e7f123456 HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "d1e0d2e8-4567-4a89-8012-9c8e7f123456",
        "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
        "status": "active",
        "institutions": {
          "name": "Birsa Institute of Technology (BIT) Sindri",
          "district": "Dhanbad"
        },
        "milestones": []
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.4 Submit Industry Engagement Proposal
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/collaboration/engagements`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.createEngagement`
- **Purpose**: Submit CSR funding, mentorship, lab equipment, or pilot incubation proposal for a challenge.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `industry_partner`, `super_admin`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    challenge_id: string; // required UUID
    engagement_type: "funding" | "mentorship" | "resources" | "pilot_testing" | "incubation";
    proposal_notes?: string;
  }
  ```
- **Response Schema**: Created engagement record
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`NO_ORG_ASSOCIATION` / `ENGAGEMENT_CREATION_FAILED`)
- **Example Request**:
  ```http
  POST /api/v1/collaboration/engagements HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
    "engagement_type": "funding",
    "proposal_notes": "Tata Steel CSR offering Rs 5 Lakhs grant for pilot water filtration units."
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "c7e0d2e8-4567-4a89-8012-9c8e7f123456",
      "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
      "engagement_type": "funding",
      "proposal_notes": "Tata Steel CSR offering Rs 5 Lakhs grant...",
      "status": "pending"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.5 Accept / Decline Industry Engagement
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/collaboration/engagements/:id/status`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.updateEngagementStatus`
- **Purpose**: University Admin or Govt review and accept/decline industry partnership proposal.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `university_admin`, `super_admin`, `govt_viewer`
- **Path Parameters**:
  - `id` (string, UUID): Engagement ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    status: "accepted" | "rejected" | "completed";
  }
  ```
- **Response Schema**: Updated Engagement record
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `400 Bad Request` (`ENGAGEMENT_STATUS_UPDATE_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/collaboration/engagements/c7e0d2e8-4567-4a89-8012-9c8e7f123456/status HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "status": "accepted"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "c7e0d2e8-4567-4a89-8012-9c8e7f123456",
      "status": "accepted"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.6 Create Milestone
- **HTTP Method**: `POST`
- **Full Route**: `/api/v1/collaboration/milestones`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.createMilestone`
- **Purpose**: Create actionable project milestone with deliverables and due dates. Automatically transitions challenge to `in_progress`.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `university_admin`, `faculty`, `super_admin`
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    project_id: string;   // required UUID of Project Team
    title: string;        // required
    description?: string; // optional
    due_date?: string;    // optional ISO 8601 string
  }
  ```
- **Response Schema**: Created Milestone object
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `404 Not Found` (`PROJECT_NOT_FOUND`)
  - `400 Bad Request` (`MILESTONE_CREATION_FAILED`)
- **Example Request**:
  ```http
  POST /api/v1/collaboration/milestones HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "project_id": "d1e0d2e8-4567-4a89-8012-9c8e7f123456",
    "title": "Milestone 1: Water Sample Collection & Lab Chemical Analysis",
    "description": "Collect 50 groundwater samples across Dumka block.",
    "due_date": "2026-09-30T00:00:00.000Z"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "a9e0d2e8-4567-4a89-8012-9c8e7f123456",
      "project_id": "d1e0d2e8-4567-4a89-8012-9c8e7f123456",
      "title": "Milestone 1: Water Sample Collection & Lab Chemical Analysis",
      "status": "in_progress",
      "approval_status": "pending",
      "due_date": "2026-09-30T00:00:00.000Z"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.7 Submit Milestone Deliverable
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/collaboration/milestones/:id/submit`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.submitDeliverable`
- **Purpose**: Submit document, report, or repository link for milestone evaluation.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `faculty`, `student`, `university_admin`, `super_admin`
- **Path Parameters**:
  - `id` (string, UUID): Milestone ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    deliverable_url: string; // required valid URL or storage link
  }
  ```
- **Response Schema**: Updated Milestone object with `status: 'submitted'`
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`DELIVERABLE_SUBMISSION_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/collaboration/milestones/a9e0d2e8-4567-4a89-8012-9c8e7f123456/submit HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

  {
    "deliverable_url": "https://wwmskwauqxinghdwlwde.supabase.co/storage/v1/object/public/challenge-media/dumka_water_report.pdf"
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "a9e0d2e8-4567-4a89-8012-9c8e7f123456",
      "deliverable_url": "https://wwmskwauqxinghdwlwde.supabase.co/storage/v1/object/public/challenge-media/dumka_water_report.pdf",
      "status": "submitted",
      "approval_status": "pending"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 4.8 Approve / Reject Milestone Deliverable
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/collaboration/milestones/:id/approve`
- **Module**: `CollaborationModule`
- **Controller**: `CollaborationController.approveMilestone`
- **Purpose**: Verify deliverable. When all milestones for a challenge reach `approved`, the challenge status automatically transitions to `completed`.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: `super_admin`, `govt_viewer`, `university_admin`
- **Path Parameters**:
  - `id` (string, UUID): Milestone ID
- **Query Parameters**: None
- **Request Body Schema**:
  ```typescript
  {
    approval_status: "approved" | "rejected";
    approval_notes?: string;
  }
  ```
- **Response Schema**: Updated Milestone object
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `403 Forbidden`
  - `400 Bad Request` (`MILESTONE_APPROVAL_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/collaboration/milestones/a9e0d2e8-4567-4a89-8012-9c8e7f123456/approve HTTP/1.1
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json

  {
    "approval_status": "approved",
    "approval_notes": "Report and laboratory water test results verified and accepted."
  }
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "a9e0d2e8-4567-4a89-8012-9c8e7f123456",
      "status": "completed",
      "approval_status": "approved",
      "approved_by": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
      "approval_notes": "Report and laboratory water test results verified and accepted."
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 5. Notifications Module

### 5.1 Get My Notifications
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/notifications`
- **Module**: `NotificationsModule`
- **Controller**: `NotificationsController.getMyNotifications`
- **Purpose**: Fetch in-app notifications for the logged-in user with optional unread filter.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**: None
- **Query Parameters**:
  - `unreadOnly` (optional boolean, `true` / `false`)
- **Response Schema**: Array of Notification objects
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`NOTIFICATIONS_FETCH_FAILED`)
- **Example Request**:
  ```http
  GET /api/v1/notifications?unreadOnly=true HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "b1e0d2e8-4567-4a89-8012-9c8e7f123456",
        "recipient_id": "e7b0d2e8-4567-4a89-8012-9c8e7f123456",
        "type": "challenge_routed",
        "read_status": false,
        "payload": {
          "challenge_id": "b3e0d2e8-4567-4a89-8012-9c8e7f123456",
          "title": "Arsenic Contamination in Drinking Well at Kathikund",
          "priority_score": 85,
          "district": "Dumka"
        },
        "created_at": "2026-08-29T11:45:00.000Z"
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 5.2 Mark Notification as Read
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/notifications/:id/read`
- **Module**: `NotificationsModule`
- **Controller**: `NotificationsController.markAsRead`
- **Purpose**: Mark single notification as read.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**:
  - `id` (string, UUID): Notification ID
- **Query Parameters**: None
- **Request Body Schema**: None
- **Response Schema**: Updated Notification object
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`NOTIFICATION_UPDATE_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/notifications/b1e0d2e8-4567-4a89-8012-9c8e7f123456/read HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "b1e0d2e8-4567-4a89-8012-9c8e7f123456",
      "read_status": true
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 5.3 Mark All Notifications as Read
- **HTTP Method**: `PATCH`
- **Full Route**: `/api/v1/notifications/read-all`
- **Module**: `NotificationsModule`
- **Controller**: `NotificationsController.markAllAsRead`
- **Purpose**: Mark all user notifications as read in a single batch.
- **Authentication Required**: `Yes` (Bearer Token)
- **Required Roles**: Any authenticated role
- **Path Parameters**: None
- **Query Parameters**: None
- **Request Body Schema**: None
- **Response Schema**: `{ message: 'All notifications marked as read' }`
- **Possible Error Responses**:
  - `401 Unauthorized`
  - `400 Bad Request` (`NOTIFICATIONS_MARK_READ_FAILED`)
- **Example Request**:
  ```http
  PATCH /api/v1/notifications/read-all HTTP/1.1
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "message": "All notifications marked as read"
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 6. Analytics Module

### 6.1 Get Platform Overview Metrics
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/analytics/overview`
- **Module**: `AnalyticsModule`
- **Controller**: `AnalyticsController.getOverview`
- **Purpose**: High-level platform statistics including challenge counts, user counts, participating institutions, active teams, milestone statistics, and status/district/category breakdowns.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Response Schema**:
  ```typescript
  {
    statusCode: 200,
    data: {
      totals: {
        challenges: number;
        users: number;
        institutions: number;
        activeTeams: number;
        milestones: number;
      },
      statusBreakdown: Record<string, number>;
      districtBreakdown: Record<string, number>;
      categoryBreakdown: Record<string, number>;
    },
    timestamp: string;
  }
  ```
- **Possible Error Responses**:
  - `500 Internal Server Error`
- **Example Request**:
  ```http
  GET /api/v1/analytics/overview HTTP/1.1
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "totals": {
        "challenges": 124,
        "users": 850,
        "institutions": 7,
        "activeTeams": 32,
        "milestones": 96
      },
      "statusBreakdown": {
        "submitted": 15,
        "routed": 28,
        "team_formed": 12,
        "in_progress": 45,
        "completed": 20,
        "validated": 4
      },
      "districtBreakdown": {
        "Ranchi": 35,
        "Dhanbad": 28,
        "Dumka": 20,
        "East Singhbhum": 41
      },
      "categoryBreakdown": {
        "Water & Sanitation": 38,
        "Education": 30,
        "Healthcare": 26,
        "Clean Energy": 30
      }
    },
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 6.2 Get Category Breakdown
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/analytics/by-category`
- **Module**: `AnalyticsModule`
- **Controller**: `AnalyticsController.getCategoryBreakdown`
- **Purpose**: Challenge metrics grouped by the 10 societal categories with completion rates and average priority scores.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Response Schema**: Array of Category Analytics objects
- **Possible Error Responses**:
  - `500 Internal Server Error`
- **Example Request**:
  ```http
  GET /api/v1/analytics/by-category HTTP/1.1
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "c1000000-0000-0000-0000-000000000004",
        "name": "Water & Sanitation",
        "slug": "water",
        "total": 38,
        "inProgress": 18,
        "completed": 12,
        "averagePriorityScore": 82.5
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 6.3 Get District Heatmap Metrics
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/analytics/by-district`
- **Module**: `AnalyticsModule`
- **Controller**: `AnalyticsController.getDistrictBreakdown`
- **Purpose**: District-by-district breakdown of active and resolved challenges sorted for GIS heatmap rendering.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Response Schema**: Array of District Metrics objects sorted descending by total challenges
- **Possible Error Responses**:
  - `500 Internal Server Error`
- **Example Request**:
  ```http
  GET /api/v1/analytics/by-district HTTP/1.1
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "district": "East Singhbhum",
        "total": 41,
        "resolved": 15,
        "active": 26
      },
      {
        "district": "Ranchi",
        "total": 35,
        "resolved": 10,
        "active": 25
      },
      {
        "district": "Dhanbad",
        "total": 28,
        "resolved": 8,
        "active": 20
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

### 6.4 Get Institution Leaderboard
- **HTTP Method**: `GET`
- **Full Route**: `/api/v1/analytics/institutions`
- **Module**: `AnalyticsModule`
- **Controller**: `AnalyticsController.getInstitutionLeaderboard`
- **Purpose**: Performance and workload leaderboard of universities and industry partners with challenge counts and completed milestones.
- **Authentication Required**: `No` (`@Public()`)
- **Required Roles**: Public
- **Path Parameters**: None
- **Query Parameters**: None
- **Response Schema**: Array of Institutional Leaderboard records
- **Possible Error Responses**:
  - `500 Internal Server Error`
- **Example Request**:
  ```http
  GET /api/v1/analytics/institutions HTTP/1.1
  ```
- **Example Response**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "a1000000-0000-0000-0000-000000000001",
        "name": "Birsa Institute of Technology (BIT) Sindri",
        "type": "university",
        "district": "Dhanbad",
        "domainExpertise": ["engineering", "environment", "energy", "water", "urban_development"],
        "totalAssignedChallenges": 14,
        "activeTeamsCount": 8,
        "completedMilestones": 24
      }
    ],
    "timestamp": "2026-08-29T11:45:00.000Z"
  }
  ```

---

## 7. AI Subsystem Architecture

The AI module does not expose dedicated public endpoints because its intelligence is embedded seamlessly into the platform pipeline:
- **Challenge Ingestion**: Handled inside `POST /api/v1/challenges`.
- **Classification Engine**:
  1. Primary Provider: **Google AI Studio Gemma 2 9B / Gemini API** (`GemmaApiProvider`).
  2. Failover Provider: **Self-Hosted Ollama Gemma 2 9B** (`OllamaProvider`).
  3. Safe Baseline: **Keyword & Token Heuristic Classifier** (`ClassificationService.heuristicClassification`).
- **Administrative Override**: Managed via `POST /api/v1/challenges/:id/override-routing`.

---

## 8. Storage Subsystem Architecture

- **Bucket Name**: `challenge-media` (Publicly readable).
- **Direct Submission Upload**: Supported on `POST /api/v1/challenges` via `multipart/form-data` with form field name `file`.
- **Client Direct Uploads**: Frontend can upload directly to Supabase storage bucket using the `@supabase/supabase-js` storage API:
  ```typescript
  const { data, error } = await supabase.storage
    .from('challenge-media')
    .upload(`reports/${Date.now()}_report.pdf`, file);
  ```

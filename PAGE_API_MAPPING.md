# Frontend Page-to-API Route Mapping Guide

> **Societal Innovation Collaboration Portal - Frontend Screen Integration Mapping**  
> Complete blueprint mapping every frontend UI view, dashboard, and modal to backend REST endpoints.

---

## 📑 Screen Index
1. [Public Landing & Discovery Portal](#1-public-landing--discovery-portal)
2. [Authentication Screens](#2-authentication-screens)
3. [Citizen Portal Screens](#3-citizen-portal-screens)
4. [PRI / ULB Local Governance Screens](#4-pri--ulb-local-governance-screens)
5. [University & Faculty Workspace](#5-university--faculty-workspace)
6. [Student Contributor Workspace](#6-student-contributor-workspace)
7. [Industry Partner Portal](#7-industry-partner-portal)
8. [State Government & Super Admin Console](#8-state-government--super-admin-console)
9. [Global Components (Notifications & Navigation)](#9-global-components-notifications--navigation)
10. [Audit Findings & Swagger Consistency Analysis](#10-audit-findings--swagger-consistency-analysis)

---

## 1. Public Landing & Discovery Portal

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **Hero Stats Counters** | On Page Load | `GET` | `/analytics/overview` | None |
| **Category Explorer Grid** | On Page Load | `GET` | `/analytics/by-category` | None |
| **Jharkhand GIS Heatmap** | Interactive Map Hover/Click | `GET` | `/analytics/by-district` | None |
| **Institutional Leaderboard** | View Top Universities / CSR Partners | `GET` | `/analytics/institutions` | None |
| **Public Challenge Feed** | Filter / Search public problems | `GET` | `/challenges` | `?page=1&limit=10&status=routed&district=...&search=...` |

---

## 2. Authentication Screens

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **Signup Page** | Register as Citizen | `POST` | `/auth/signup` | `{ email, password, name, role: 'citizen', district, contact }` |
| **Signup Page** | Register as Faculty / Student | `POST` | `/auth/signup` | `{ email, password, name, role: 'faculty' \| 'student', org_id, district }` |
| **Signup Page** | Register as Industry Partner | `POST` | `/auth/signup` | `{ email, password, name, role: 'industry_partner', org_id }` |
| **Login Page** | Submit Credentials | `POST` | `/auth/login` | `{ email, password }` |
| **Password Reset / Session** | Check Active Session Profile | `GET` | `/users/me` | Bearer Token in `Authorization` header |

---

## 3. Citizen Portal Screens

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **Citizen Dashboard** | Load user submitted challenges | `GET` | `/challenges` | Automatically scoped to citizen via token |
| **Submit Challenge Page** | Submit form with photo upload | `POST` | `/challenges` | `FormData` with fields: `title`, `description`, `district`, `location_text`, `latitude`, `longitude`, `file` |
| **Challenge Detail View** | View AI classification & status | `GET` | `/challenges/:id` | Path param `:id` |
| **Challenge Edit Modal** | Update submission while in `submitted` state | `PATCH` | `/challenges/:id/status` or direct update | Allowed only while `status = 'submitted'` |
| **Citizen Profile Page** | View profile | `GET` | `/users/me` | None |
| **Citizen Profile Page** | Update contact details | `PATCH` | `/users/me` | `{ contact, district, name }` |

---

## 4. PRI / ULB Local Governance Screens

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **PRI / ULB Dashboard** | View local challenges in assigned district | `GET` | `/challenges` | `?district=<USER_DISTRICT>` |
| **Review Challenge Screen** | Review challenge details | `GET` | `/challenges/:id` | Path param `:id` |
| **District Users Directory** | List local verified citizens | `GET` | `/users` | `?district=<USER_DISTRICT>` |

---

## 5. University & Faculty Workspace

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **University Routed Queue** | View challenges routed to institution | `GET` | `/challenges` | `?status=routed&institution_id=<ORG_ID>` |
| **Form Team Modal** | Assign faculty lead & students | `POST` | `/collaboration/teams` | `{ challenge_id, university_id, faculty_ids: [], student_ids: [] }` |
| **Team Management Drawer** | Update assigned students / faculty | `PATCH` | `/collaboration/teams/:id/members` | `{ student_ids: [...], faculty_ids: [...] }` |
| **Project Workspace** | View team and milestone tracker | `GET` | `/collaboration/teams/challenge/:challengeId` | Path param `:challengeId` |
| **Create Milestone Modal** | Add project deliverable & due date | `POST` | `/collaboration/milestones` | `{ project_id, title, description, due_date }` |
| **Approve Milestone Screen** | Review student submission | `PATCH` | `/collaboration/milestones/:id/approve` | `{ approval_status: 'approved' \| 'rejected', approval_notes }` |
| **Industry Engagement Inbox** | View CSR / funding proposals | `GET` | `/challenges/:id` | Joined `industry_engagements` table |
| **Accept Proposal Dialog** | Accept industry funding offer | `PATCH` | `/collaboration/engagements/:id/status` | `{ status: 'accepted' \| 'rejected' }` |

---

## 6. Student Contributor Workspace

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **Assigned Projects List** | View projects where student is a member | `GET` | `/challenges` | Scoped by RLS to student's team |
| **Milestone Workspace** | View milestone deadlines | `GET` | `/collaboration/teams/challenge/:challengeId` | Path param `:challengeId` |
| **Submit Deliverable Modal** | Upload report or submit repo link | `PATCH` | `/collaboration/milestones/:id/submit` | `{ deliverable_url: "https://..." }` |

---

## 7. Industry Partner Portal

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **CSR Opportunity Feed** | Browse challenges needing funding | `GET` | `/challenges` | `?status=routed` or `?status=team_formed` |
| **Challenge Detail Screen** | View university team & technical requirements | `GET` | `/challenges/:id` | Path param `:id` |
| **Submit Proposal Modal** | Send funding / mentorship proposal | `POST` | `/collaboration/engagements` | `{ challenge_id, engagement_type: 'funding', proposal_notes }` |
| **My Engagements List** | View status of submitted proposals | `GET` | `/challenges/:id` | Joined `industry_engagements` |

---

## 8. State Government & Super Admin Console

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **State Overview Analytics** | Realtime counters & district breakdowns | `GET` | `/analytics/overview` | None |
| **All Challenges Table** | Global table with search & bulk filtering | `GET` | `/challenges` | `?page=1&limit=20` (All statuses) |
| **AI Override Modal** | Re-route challenge or change priority score | `POST` | `/challenges/:id/override-routing` | `{ assigned_institution_id, priority_score, override_reason }` |
| **Lifecycle State Controller** | Manually force status transition | `PATCH` | `/challenges/:id/status` | `{ status: 'validated' \| 'rejected', notes }` |
| **User & Institution Directory** | List all platform users | `GET` | `/users` | `?role=...&district=...` |
| **Verify Account Action** | Verify University Admin or Industry Partner | `PATCH` | `/users/:id/verify` | Path param `:id` |

---

## 9. Global Components (Notifications & Navigation)

| Screen / Component | User Action | HTTP Method | Endpoint | Request Payload / Params |
|---|---|---|---|---|
| **Top Navbar Bell Icon** | View in-app notifications | `GET` | `/notifications` | `?unreadOnly=true` |
| **Notification Item Click** | Mark specific notification as read | `PATCH` | `/notifications/:id/read` | Path param `:id` |
| **Mark All Read Button** | Clear unread notifications badge | `PATCH` | `/notifications/read-all` | None |
| **Header Profile Avatar** | Fetch active user credentials & role | `GET` | `/users/me` | None |

---

## 10. Audit Findings & Swagger Consistency Analysis

### 10.1 Endpoint Coverage Summary
- **Total Controllers**: 6 controllers (`AuthController`, `UsersController`, `ChallengesController`, `CollaborationController`, `NotificationsController`, `AnalyticsController`).
- **Total REST Endpoints**: 19 endpoints.
- **Undocumented / Shadow Endpoints**: **0** (All 19 routes have corresponding Swagger decorators and DTO validations).
- **Duplicate Routes**: **0** (All route signatures are unique).

### 10.2 Swagger Decorator Alignment
| Controller | Route | Swagger Tag | Swagger Summary Present | Auth Decorator Present | DTO Validation Pipe |
|---|---|---|---|---|---|
| `AuthController` | `POST /auth/signup` | `Auth` | ✅ Yes | `@Public()` | `SignupDto` |
| `AuthController` | `POST /auth/login` | `Auth` | ✅ Yes | `@Public()` | `LoginDto` |
| `UsersController` | `GET /users/me` | `Users` | ✅ Yes | `@ApiBearerAuth()` | Authenticated Decorator |
| `UsersController` | `PATCH /users/me` | `Users` | ✅ Yes | `@ApiBearerAuth()` | Explicit Type |
| `UsersController` | `PATCH /users/:id/verify`| `Users` | ✅ Yes | `@ApiBearerAuth()` | Param UUID |
| `UsersController` | `GET /users` | `Users` | ✅ Yes | `@ApiBearerAuth()` | `@ApiQuery()` |
| `ChallengesController` | `POST /challenges` | `Challenges` | ✅ Yes | `@ApiBearerAuth()` | `CreateChallengeDto` |
| `ChallengesController` | `GET /challenges` | `Challenges` | ✅ Yes | `@ApiBearerAuth()` | `FilterChallengeDto` |
| `ChallengesController` | `GET /challenges/:id` | `Challenges` | ✅ Yes | `@ApiBearerAuth()` | Param UUID |
| `ChallengesController` | `POST /challenges/:id/override-routing` | `Challenges` | ✅ Yes | `@ApiBearerAuth()` | `OverrideRoutingDto` |
| `ChallengesController` | `PATCH /challenges/:id/status` | `Challenges` | ✅ Yes | `@ApiBearerAuth()` | `UpdateStatusDto` |
| `CollaborationController` | `POST /collaboration/teams` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `CreateTeamDto` |
| `CollaborationController` | `PATCH /collaboration/teams/:id/members` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `AssignMembersDto` |
| `CollaborationController` | `GET /collaboration/teams/challenge/:challengeId` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | Param UUID |
| `CollaborationController` | `POST /collaboration/engagements` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `CreateEngagementDto` |
| `CollaborationController` | `PATCH /collaboration/engagements/:id/status` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `UpdateEngagementStatusDto` |
| `CollaborationController` | `POST /collaboration/milestones` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `CreateMilestoneDto` |
| `CollaborationController` | `PATCH /collaboration/milestones/:id/submit` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `SubmitDeliverableDto` |
| `CollaborationController` | `PATCH /collaboration/milestones/:id/approve` | `Collaboration` | ✅ Yes | `@ApiBearerAuth()` | `ApproveMilestoneDto` |
| `NotificationsController` | `GET /notifications` | `Notifications` | ✅ Yes | `@ApiBearerAuth()` | `@ApiQuery()` |
| `NotificationsController` | `PATCH /notifications/:id/read` | `Notifications` | ✅ Yes | `@ApiBearerAuth()` | Param UUID |
| `NotificationsController` | `PATCH /notifications/read-all` | `Notifications` | ✅ Yes | `@ApiBearerAuth()` | Authenticated Decorator |
| `AnalyticsController` | `GET /analytics/overview` | `Analytics` | ✅ Yes | `@Public()` | None |
| `AnalyticsController` | `GET /analytics/by-category` | `Analytics` | ✅ Yes | `@Public()` | None |
| `AnalyticsController` | `GET /analytics/by-district` | `Analytics` | ✅ Yes | `@Public()` | None |
| `AnalyticsController` | `GET /analytics/institutions` | `Analytics` | ✅ Yes | `@Public()` | None |

### 10.3 Architecture Insights
1. **AI Subsystem**: Integrated transparently within `POST /challenges` with failover logic (Gemma API ➔ Ollama ➔ Heuristic Rules).
2. **Storage Subsystem**: Supports binary uploads directly during `POST /challenges` via `multipart/form-data` and direct Supabase storage uploads for deliverables.
3. **Database Security**: Enforces PostgreSQL Row-Level Security (RLS) dynamically per role.

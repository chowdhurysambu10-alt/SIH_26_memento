# Societal Innovation Collaboration Portal - API Contract & Documentation

This document serves as the single source of truth for frontend developers, mobile engineers, and platform integrations.

---

## 1. System Enums

### 1.1 User Roles (`UserRole`)
| Role | Enum Value | Description |
| :--- | :--- | :--- |
| Citizen | `citizen` | Submits societal challenges from local Jharkhand areas |
| PRI / ULB Official | `pri_ulb_official` | Panchayat / Urban Local Body official monitoring local jurisdiction |
| University Admin | `university_admin` | Dean/Director managing institutional projects and forming faculty teams |
| Faculty | `faculty` | Lead mentor / researcher driving solution execution |
| Student | `student` | Project contributor building deliverables / field reports |
| Industry Partner | `industry_partner` | CSR / Corporate entity funding and mentoring projects |
| Govt Viewer | `govt_viewer` | State department monitors reviewing progress and dashboards |
| Super Admin | `super_admin` | Full system administrator with override capabilities |

### 1.2 Challenge Lifecycle Statuses (`ChallengeStatus`)
The state machine enforces the following linear progression:
`submitted` ➔ `under_review` ➔ `routed` ➔ `team_formed` ➔ `in_progress` ➔ `completed` ➔ `validated`

| Status | Value | Description |
| :--- | :--- | :--- |
| Submitted | `submitted` | Challenge lodged by citizen, pending AI/manual routing |
| Under Review | `under_review` | Challenge flagged or sent for manual department review |
| Routed | `routed` | AI / Admin assigned challenge to a matching university |
| Team Formed | `team_formed` | University formed faculty + student project team |
| In Progress | `in_progress` | Milestones underway, field testing and prototyping active |
| Completed | `completed` | All milestone deliverables approved |
| Validated | `validated` | Solution validated and verified on-ground in Jharkhand |

### 1.3 Pre-Seeded Challenge Categories
1. `education` - Education & Digital Literacy
2. `agriculture` - Agriculture & Crop Science
3. `healthcare` - Healthcare & Telemedicine
4. `water` - Water, Sanitation & Arsenic Control
5. `environment` - Environment, Forestry & Mine Reclamation
6. `energy` - Clean Energy & Solar Grids
7. `urban_development` - Urban Infrastructure & Waste Management
8. `accessibility` - Accessibility & Assistive Tech
9. `public_administration` - Public Administration & Grievance Redressal
10. `rural_livelihoods` - Rural Livelihoods, SHG & Tribal Crafts

### 1.4 Milestone Statuses & Approval Statuses
- Milestone Status: `pending` | `in_progress` | `submitted` | `completed`
- Approval Status: `pending` | `approved` | `rejected`
- Industry Engagement: `funding` | `mentorship` | `technology` | `internships`

---

## 2. Standard Response & Error Envelopes

### Success Response
```json
{
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-08-29T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "statusCode": 200,
  "data": [ ... ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "timestamp": "2026-08-29T10:30:00.000Z"
}
```

### Error Response Shape
```json
{
  "statusCode": 400,
  "message": "Invalid state transition from 'submitted' to 'completed'. Allowed transitions: [under_review, routed].",
  "errorCode": "INVALID_STATE_TRANSITION",
  "timestamp": "2026-08-29T10:30:00.000Z"
}
```

---

## 3. Endpoints Specification

### 3.1 Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/signup`
Creates user in Supabase Auth & public user profile with role assignment.
- **Request Body**:
```json
{
  "email": "priya.sharma@bau.edu.in",
  "password": "Password123!",
  "name": "Dr. Priya Sharma",
  "role": "faculty",
  "org_id": "i1000000-0000-0000-0000-000000000002",
  "district": "Ranchi",
  "contact": "+91 9876543210"
}
```
- **Response `201 Created`**:
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": "u1000000-0000-0000-0000-000000000001",
      "email": "priya.sharma@bau.edu.in",
      "name": "Dr. Priya Sharma",
      "role": "faculty",
      "org_id": "i1000000-0000-0000-0000-000000000002",
      "district": "Ranchi",
      "verified": false
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "...",
      "expires_at": 1788000000
    }
  }
}
```

#### `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "priya.sharma@bau.edu.in",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "u1000000-0000-0000-0000-000000000001",
      "email": "priya.sharma@bau.edu.in",
      "role": "faculty",
      "org_id": "i1000000-0000-0000-0000-000000000002"
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "..."
    }
  }
}
```

---

### 3.2 Challenges (`/api/v1/challenges`)

#### `POST /api/v1/challenges`
Submits challenge, triggers Gemma AI classification, calculates priority score (1-100), checks duplicate similarity, and auto-routes to matching university.
- **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: multipart/form-data` or `application/json`
- **Request Body / Form-Data**:
  - `title`: "Arsenic Contamination in Tube Wells at Kathikund Block"
  - `description`: "High concentration of arsenic in 12 community borewells in Dumka causing skin lesions."
  - `district`: "Dumka"
  - `location_text`: "Village Kathikund, Block 4"
  - `latitude`: 24.2694
  - `longitude`: 87.2476
  - `file`: (Optional image attachment)
- **Response `201 Created`**:
```json
{
  "statusCode": 201,
  "data": {
    "id": "c1000000-0000-0000-0000-000000000099",
    "title": "Arsenic Contamination in Tube Wells at Kathikund Block",
    "description": "High concentration of arsenic in 12 community borewells in Dumka causing skin lesions.",
    "district": "Dumka",
    "status": "routed",
    "priority_score": 88.5,
    "duplicate_of": null,
    "assigned_institution_id": "i1000000-0000-0000-0000-000000000001",
    "media_urls": [
      "https://demo.supabase.co/storage/v1/object/public/challenge-media/challenges/1724930000_well.jpg"
    ],
    "ai_classification": {
      "categorySlug": "water",
      "categoryName": "Water & Sanitation",
      "priorityScore": 88,
      "recommendedKeywords": ["arsenic", "groundwater", "filtration"],
      "duplicateCandidateId": null,
      "duplicateSimilarityScore": 0.05,
      "providerUsed": "GemmaAPI (Google AI Studio)",
      "processedAt": "2026-08-29T10:35:00.000Z"
    },
    "categories": { "name": "Water & Sanitation", "slug": "water" },
    "institutions": { "name": "Birsa Institute of Technology (BIT) Sindri", "district": "Dhanbad" }
  }
}
```

#### `GET /api/v1/challenges`
Filterable and paginated list.
- **Query Params**: `page=1`, `limit=10`, `status=routed`, `category_slug=water`, `district=Dumka`, `search=arsenic`
- **Response `200 OK`**:
```json
{
  "statusCode": 200,
  "data": [ ... ],
  "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
}
```

#### `GET /api/v1/challenges/:id`
Retrieves challenge details, assigned university, formed teams, and industry offers.

#### `POST /api/v1/challenges/:id/override-routing`
(Roles: `super_admin`, `govt_viewer`)
- **Request Body**:
```json
{
  "category_id": "c1000000-0000-0000-0000-000000000004",
  "assigned_institution_id": "i1000000-0000-0000-0000-000000000001",
  "priority_score": 95,
  "override_reason": "Escalated due to direct directive from Department of Drinking Water."
}
```

#### `PATCH /api/v1/challenges/:id/status`
Enforces state machine transitions.
- **Request Body**:
```json
{
  "status": "team_formed",
  "notes": "Faculty mentors and student researchers allocated."
}
```

---

### 3.3 Collaboration & Milestones (`/api/v1/collaboration`)

#### `POST /api/v1/collaboration/teams`
(Roles: `university_admin`, `faculty`, `super_admin`)
```json
{
  "challenge_id": "c1000000-0000-0000-0000-000000000099",
  "university_id": "i1000000-0000-0000-0000-000000000001",
  "faculty_ids": ["u1000000-0000-0000-0000-000000000001"],
  "student_ids": ["u1000000-0000-0000-0000-000000000002"]
}
```

#### `POST /api/v1/collaboration/engagements`
(Roles: `industry_partner`, `super_admin`)
```json
{
  "challenge_id": "c1000000-0000-0000-0000-000000000099",
  "engagement_type": "funding",
  "proposal_notes": "Tata Steel CSR offering Rs 5 Lakhs for pilot water filtration units."
}
```

#### `POST /api/v1/collaboration/milestones`
```json
{
  "project_id": "t1000000-0000-0000-0000-000000000001",
  "title": "Phase 1: Water Chemical Analysis and Prototype Design",
  "description": "Collect samples, design low-cost activated alumina filter.",
  "due_date": "2026-10-15T00:00:00.000Z"
}
```

#### `PATCH /api/v1/collaboration/milestones/:id/submit`
(Roles: `faculty`, `student`, `university_admin`)
```json
{
  "deliverable_url": "https://demo.supabase.co/storage/v1/object/public/challenge-media/prototype_design_v1.pdf"
}
```

#### `PATCH /api/v1/collaboration/milestones/:id/approve`
(Roles: `university_admin`, `govt_viewer`, `super_admin`)
```json
{
  "approval_status": "approved",
  "approval_notes": "All chemical metrics tested compliant with IS 10500 standards."
}
```

---

### 3.4 Notifications & Realtime (`/api/v1/notifications`)

#### `GET /api/v1/notifications?unreadOnly=true`
Returns list of user notifications.

#### `PATCH /api/v1/notifications/:id/read`
Marks notification as read.

#### Supabase Realtime Channels
Frontend clients can connect to Supabase Realtime WebSocket channel:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to live notifications for current logged in user
const channel = supabase
  .channel('realtime-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${currentUser.id}`,
    },
    (payload) => {
      console.log('Live notification received:', payload.new);
    }
  )
  .subscribe();
```

---

### 3.5 Analytics (`/api/v1/analytics`)
- `GET /api/v1/analytics/overview` - Platform high-level totals and status counts
- `GET /api/v1/analytics/by-category` - Breakdown of challenges and completion rate per category
- `GET /api/v1/analytics/by-district` - Total vs resolved counts for all 24 Jharkhand districts
- `GET /api/v1/analytics/institutions` - University & Industry leaderboard

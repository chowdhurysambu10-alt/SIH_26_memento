import { Institution, User } from '../types/auth.types';
import { Category, Challenge } from '../types/challenge.types';
import { IndustryEngagement, Milestone, ProjectTeam } from '../types/collaboration.types';
import { AnalyticsOverview, CategoryAnalytics, DistrictAnalytics, InstitutionLeaderboardItem } from '../types/analytics.types';
import { Notification } from '../types/notification.types';

export const JHARKHAND_DISTRICTS = [
  'Garhwa', 'Palamu', 'Chatra', 'Hazaribagh', 'Koderma', 'Giridih',
  'Deoghar', 'Dumka', 'Godda', 'Sahibganj', 'Pakur', 'Jamtara',
  'Dhanbad', 'Bokaro', 'Ranchi', 'Lohardaga', 'Gumla', 'Simdega',
  'Latehar', 'Ramgarh', 'East Singhbhum', 'West Singhbhum', 'Saraikela Kharsawan', 'Khunti'
];

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Education',
    slug: 'education',
    description: 'Primary, secondary, vocational training, smart classrooms, and digital literacy in rural & tribal areas.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Agriculture',
    slug: 'agriculture',
    description: 'Crop protection, soil health, drip irrigation, post-harvest storage, and millet mission.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Primary health centers, maternal care, telemedicine, tribal nutrition, and endemic disease control.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Water & Sanitation',
    slug: 'water',
    description: 'Drinking water access, groundwater recharge, pond revival, and Jal Jeevan Mission monitoring.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Environment & Forestry',
    slug: 'environment',
    description: 'Forest conservation, mine reclamation, pollution tracking, and biodiversity preservation.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Clean Energy',
    slug: 'energy',
    description: 'Solar mini-grids, biomass power, clean cooking fuels, and renewable storage.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    name: 'Urban Infrastructure',
    slug: 'urban_development',
    description: 'Traffic management, waste segregation, stormwater drainage, and smart streetlighting in cities.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000008',
    name: 'Accessibility & Inclusion',
    slug: 'accessibility',
    description: 'Assistive technologies for persons with disabilities, elder care, and accessible public infrastructure.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000009',
    name: 'Public Administration',
    slug: 'public_administration',
    description: 'Grievance redressal, direct benefit transfer auditing, citizen charter tracking, and transparent ULB portals.'
  },
  {
    id: 'c1000000-0000-0000-0000-000000000010',
    name: 'Rural Livelihoods',
    slug: 'rural_livelihoods',
    description: 'Lac cultivation, silk weaving, minor forest produce processing, SHG market linkages, and handicrafts.'
  }
];

export const MOCK_INSTITUTIONS: Institution[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Birsa Institute of Technology (BIT) Sindri',
    type: 'university',
    domain_expertise: ['engineering', 'environment', 'energy', 'water', 'urban_development'],
    location: 'Dhanbad, Jharkhand',
    district: 'Dhanbad',
    contact_email: 'innovations@bitsindri.ac.in',
    contact_phone: '+91 326 2350495'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Birsa Agricultural University (BAU)',
    type: 'university',
    domain_expertise: ['agriculture', 'rural_livelihoods', 'water', 'environment'],
    location: 'Kanke, Ranchi, Jharkhand',
    district: 'Ranchi',
    contact_email: 'vc@bauranchi.org',
    contact_phone: '+91 651 2455911'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    name: 'National Institute of Technology (NIT) Jamshedpur',
    type: 'university',
    domain_expertise: ['technology', 'education', 'accessibility', 'energy', 'urban_development'],
    location: 'Adityapur, Jamshedpur, Jharkhand',
    district: 'East Singhbhum',
    contact_email: 'dean.rnc@nitjsr.ac.in',
    contact_phone: '+91 657 2373407'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    name: 'Rajendra Institute of Medical Sciences (RIMS)',
    type: 'university',
    domain_expertise: ['healthcare', 'nutrition', 'tribal_health', 'accessibility'],
    location: 'Bariatu, Ranchi, Jharkhand',
    district: 'Ranchi',
    contact_email: 'director@rimsranchi.ac.in',
    contact_phone: '+91 651 2951910'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    name: 'Tata Steel CSR Foundation',
    type: 'industry',
    domain_expertise: ['rural_livelihoods', 'healthcare', 'education', 'water'],
    location: 'Jamshedpur, Jharkhand',
    district: 'East Singhbhum',
    contact_email: 'csr@tatasteel.com',
    contact_phone: '+91 657 6644000'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000006',
    name: 'Central Coalfields Limited (CCL) Innovation Cell',
    type: 'industry',
    domain_expertise: ['environment', 'clean_energy', 'mine_reclamation', 'water'],
    location: 'Darbhanga House, Ranchi, Jharkhand',
    district: 'Ranchi',
    contact_email: 'csr.ccl@coalindia.in',
    contact_phone: '+91 651 2360123'
  },
  {
    id: 'a1000000-0000-0000-0000-000000000007',
    name: 'Jharkhand State Livelihood Promotion Society (JSLPS)',
    type: 'govt',
    domain_expertise: ['rural_livelihoods', 'agriculture', 'women_empowerment', 'shg'],
    location: 'Ranchi, Jharkhand',
    district: 'Ranchi',
    contact_email: 'support@jslps.in',
    contact_phone: '+91 651 2400100'
  }
];

export const DEMO_USERS: Record<string, User> = {
  citizen: {
    id: 'u0000000-0000-0000-0000-000000000001',
    name: 'Rajesh Soren',
    email: 'rajesh.soren@jharkhand.in',
    role: 'citizen',
    district: 'Dumka',
    contact: '+91 9431102938',
    verified: true
  },
  pri_ulb_official: {
    id: 'u0000000-0000-0000-0000-000000000002',
    name: 'Sunita Devi (Mukhiya, Kathikund)',
    email: 'mukhiya.kathikund@panchayat.gov.in',
    role: 'pri_ulb_official',
    district: 'Dumka',
    contact: '+91 9835012345',
    verified: true
  },
  university_admin: {
    id: 'u0000000-0000-0000-0000-000000000003',
    name: 'Prof. D. K. Singh (Dean Academics)',
    email: 'dean@bitsindri.ac.in',
    role: 'university_admin',
    org_id: 'a1000000-0000-0000-0000-000000000001',
    district: 'Dhanbad',
    contact: '+91 326 2350495',
    verified: true,
    institution: MOCK_INSTITUTIONS[0]
  },
  faculty: {
    id: 'u0000000-0000-0000-0000-000000000004',
    name: 'Dr. Amit Verma (Associate Professor, Chemical Engg)',
    email: 'amit.verma@bitsindri.ac.in',
    role: 'faculty',
    org_id: 'a1000000-0000-0000-0000-000000000001',
    district: 'Dhanbad',
    contact: '+91 9835000000',
    verified: true,
    institution: MOCK_INSTITUTIONS[0]
  },
  student: {
    id: 'u0000000-0000-0000-0000-000000000005',
    name: 'Ananya Roy (B.Tech Final Year)',
    email: 'ananya.roy@bitsindri.ac.in',
    role: 'student',
    org_id: 'a1000000-0000-0000-0000-000000000001',
    district: 'Dhanbad',
    contact: '+91 7004123456',
    verified: true,
    institution: MOCK_INSTITUTIONS[0]
  },
  industry_partner: {
    id: 'u0000000-0000-0000-0000-000000000006',
    name: 'Vikramaditya Sengupta (Head, CSR Initiatives)',
    email: 'vikram.sengupta@tatasteel.com',
    role: 'industry_partner',
    org_id: 'a1000000-0000-0000-0000-000000000005',
    district: 'East Singhbhum',
    contact: '+91 657 6644111',
    verified: true,
    institution: MOCK_INSTITUTIONS[4]
  },
  govt_viewer: {
    id: 'u0000000-0000-0000-0000-000000000007',
    name: 'Siddharth Tripathy (IAS, Planning & Development)',
    email: 'sec.planning@jharkhand.gov.in',
    role: 'govt_viewer',
    district: 'Ranchi',
    contact: '+91 651 2400999',
    verified: true
  },
  super_admin: {
    id: 'u0000000-0000-0000-0000-000000000008',
    name: 'State Innovation Lead Administrator',
    email: 'admin@innovation.jharkhand.gov.in',
    role: 'super_admin',
    district: 'Ranchi',
    contact: '+91 651 2400001',
    verified: true
  }
};

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
    title: 'High Arsenic & Heavy Metal Contamination in Village Tube Wells',
    description: 'Over 350 households in Kathikund block are suffering from recurring dermatological lesions and chronic gastritis due to exceeding safe limits of arsenic (0.05 mg/L) in community handpumps.',
    category_id: 'c1000000-0000-0000-0000-000000000004',
    status: 'in_progress',
    district: 'Dumka',
    location_text: 'Ward 4, Kathikund Block, Near Primary Health Sub-Center',
    latitude: 24.2694,
    longitude: 87.2476,
    priority_score: 88.5,
    media_urls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'a1000000-0000-0000-0000-000000000001',
    ai_classification: {
      categorySlug: 'water',
      categoryName: 'Water & Sanitation',
      priorityScore: 88.5,
      recommendedKeywords: ['arsenic', 'groundwater', 'filtration', 'electrodialysis', 'handpump'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.05,
      rationale: 'Severe health hazard in tribal hamlet with verified ground water contamination requiring chemical adsorption filters.',
      providerUsed: 'GemmaAPI (Google AI Studio Gemma 2 9B)',
      processedAt: '2026-08-29T10:35:00.000Z'
    },
    submitted_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2026-08-20T08:30:00.000Z',
    updated_at: '2026-08-28T14:20:00.000Z',
    categories: MOCK_CATEGORIES[3],
    institutions: MOCK_INSTITUTIONS[0],
    submitter: DEMO_USERS.citizen
  },
  {
    id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123457',
    title: 'Lack of Cold Chain Storage for Lac and Minor Forest Produce (MFP)',
    description: 'Tribal farmers in Khunti suffer up to 40% post-harvest value loss of Kusmi lac during peak monsoon heat due to absence of low-cost localized solar evaporative storage units.',
    category_id: 'c1000000-0000-0000-0000-000000000010',
    status: 'routed',
    district: 'Khunti',
    location_text: 'Torpa Block, Haat Bazaar compound',
    latitude: 22.9818,
    longitude: 85.2796,
    priority_score: 76.0,
    media_urls: [
      'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'a1000000-0000-0000-0000-000000000002',
    ai_classification: {
      categorySlug: 'rural_livelihoods',
      categoryName: 'Rural Livelihoods',
      priorityScore: 76.0,
      recommendedKeywords: ['lac cultivation', 'solar cold storage', 'tribal economy', 'value addition'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.08,
      rationale: 'Economic vulnerability affecting 120 SHG women producers in lac harvesting belt.',
      providerUsed: 'GemmaAPI (Google AI Studio)',
      processedAt: '2026-08-25T11:00:00.000Z'
    },
    submitted_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2026-08-25T10:45:00.000Z',
    updated_at: '2026-08-26T09:15:00.000Z',
    categories: MOCK_CATEGORIES[9],
    institutions: MOCK_INSTITUTIONS[1]
  },
  {
    id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123458',
    title: 'Coal Dust Pollution & Respiratory Distress in Overburden Dump Vicinity',
    description: 'Windborne fugitive dust from abandoned open-cast overburden dumps in Jharia causes PM2.5 levels exceeding 280 ug/m3, causing chronic pediatric asthma.',
    category_id: 'c1000000-0000-0000-0000-000000000005',
    status: 'team_formed',
    district: 'Dhanbad',
    location_text: 'Jharia Main Road, Bastacolla area',
    latitude: 23.7431,
    longitude: 86.4172,
    priority_score: 92.0,
    media_urls: [
      'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'a1000000-0000-0000-0000-000000000001',
    ai_classification: {
      categorySlug: 'environment',
      categoryName: 'Environment & Forestry',
      priorityScore: 92.0,
      recommendedKeywords: ['coal dust', 'mine reclamation', 'air quality', 'vetiver grass bio-cover'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.12,
      rationale: 'Critical air pollution hazard with high health exposure index in densely populated mining zone.',
      providerUsed: 'GemmaAPI (Google AI Studio)',
      processedAt: '2026-08-22T14:30:00.000Z'
    },
    submitted_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2026-08-22T14:00:00.000Z',
    updated_at: '2026-08-27T16:45:00.000Z',
    categories: MOCK_CATEGORIES[4],
    institutions: MOCK_INSTITUTIONS[0]
  },
  {
    id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123459',
    title: 'Smart Telemedicine Diagnostic Kiosk for Remote Tribal Anganwadi Centers',
    description: 'Patients in remote Saranda forest villages need automated vital signs screening (BP, ECG, SpO2, Hb) with offline synchronization to district civil hospitals.',
    category_id: 'c1000000-0000-0000-0000-000000000003',
    status: 'completed',
    district: 'West Singhbhum',
    location_text: 'Manoharpur Block, Tribal Sub-Plan area',
    latitude: 22.3789,
    longitude: 85.1978,
    priority_score: 84.0,
    media_urls: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'a1000000-0000-0000-0000-000000000004',
    ai_classification: {
      categorySlug: 'healthcare',
      categoryName: 'Healthcare',
      priorityScore: 84.0,
      recommendedKeywords: ['telemedicine', 'maternal health', 'anemia', 'solar kiosk', 'saranda'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.02,
      rationale: 'Addresses acute healthcare access deficit in interior forest terrain.',
      providerUsed: 'GemmaAPI (Google AI Studio)',
      processedAt: '2026-08-10T09:00:00.000Z'
    },
    submitted_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2026-08-10T08:00:00.000Z',
    updated_at: '2026-08-28T18:00:00.000Z',
    categories: MOCK_CATEGORIES[2],
    institutions: MOCK_INSTITUTIONS[3]
  },
  {
    id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123460',
    title: 'Low-Cost Solar Drip Irrigation Controller for Finger Millet (Ragi)',
    description: 'Developing IoT based soil moisture sensor and automated solenoid valves powered by micro solar panel for terraced upland agriculture.',
    category_id: 'c1000000-0000-0000-0000-000000000002',
    status: 'validated',
    district: 'Ranchi',
    location_text: 'Ormanjhi Block, Village Kuchu',
    latitude: 23.4833,
    longitude: 85.4833,
    priority_score: 79.0,
    media_urls: [
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'a1000000-0000-0000-0000-000000000002',
    ai_classification: {
      categorySlug: 'agriculture',
      categoryName: 'Agriculture',
      priorityScore: 79.0,
      recommendedKeywords: ['millet mission', 'ragi', 'iot irrigation', 'water conservation'],
      duplicateCandidateId: null,
      duplicateSimilarityScore: 0.03,
      rationale: 'Validated solution yielding 28% water reduction and 35% crop yield increase.',
      providerUsed: 'GemmaAPI (Google AI Studio)',
      processedAt: '2026-07-15T10:00:00.000Z'
    },
    submitted_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: '2026-07-15T09:30:00.000Z',
    updated_at: '2026-08-25T12:00:00.000Z',
    categories: MOCK_CATEGORIES[1],
    institutions: MOCK_INSTITUTIONS[1]
  }
];

export const MOCK_PROJECT_TEAMS: ProjectTeam[] = [
  {
    id: 't1000000-0000-0000-0000-000000000001',
    challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
    university_id: 'a1000000-0000-0000-0000-000000000001',
    faculty_ids: ['u0000000-0000-0000-0000-000000000004'],
    student_ids: ['u0000000-0000-0000-0000-000000000005'],
    status: 'active',
    created_at: '2026-08-22T10:00:00.000Z',
    updated_at: '2026-08-28T14:20:00.000Z',
    university: MOCK_INSTITUTIONS[0],
    faculties: [DEMO_USERS.faculty],
    students: [DEMO_USERS.student]
  }
];

export const MOCK_MILESTONES: Milestone[] = [
  {
    id: 'm1000000-0000-0000-0000-000000000001',
    project_id: 't1000000-0000-0000-0000-000000000001',
    title: 'Phase 1: Water Sample Collection & Spectrophotometry Lab Assay',
    description: 'Collect 40 groundwater handpump samples from Kathikund, analyze ICP-MS arsenic concentrations, and publish baseline data.',
    due_date: '2026-09-15T00:00:00.000Z',
    status: 'completed',
    deliverable_url: 'https://wwmskwauqxinghdwlwde.supabase.co/storage/v1/object/public/challenge-media/dumka_water_analysis_phase1.pdf',
    approval_status: 'approved',
    approved_by: 'u0000000-0000-0000-0000-000000000003',
    approval_notes: 'Water test results verified and accepted. Arsenic concentration benchmark established at 0.082 mg/L.',
    created_at: '2026-08-22T11:00:00.000Z',
    updated_at: '2026-08-26T15:30:00.000Z'
  },
  {
    id: 'm1000000-0000-0000-0000-000000000002',
    project_id: 't1000000-0000-0000-0000-000000000001',
    title: 'Phase 2: Activated Alumina & Nano-Composite Filter Prototype',
    description: 'Fabricate 5 gravity-fed filtration units with regenerable alumina cartridges capable of 1500L/day purification.',
    due_date: '2026-10-10T00:00:00.000Z',
    status: 'submitted',
    deliverable_url: 'https://github.com/sih26-memento/dumka-water-purification-prototype',
    approval_status: 'pending',
    created_at: '2026-08-22T11:00:00.000Z',
    updated_at: '2026-08-28T14:15:00.000Z'
  },
  {
    id: 'm1000000-0000-0000-0000-000000000003',
    project_id: 't1000000-0000-0000-0000-000000000001',
    title: 'Phase 3: Village Deployment, Water Quality Telemetry & Handover',
    description: 'Install 5 community filtration hubs, train village Jal Sahiya committee, and connect solar water quality sensor.',
    due_date: '2026-11-05T00:00:00.000Z',
    status: 'pending',
    approval_status: 'pending',
    created_at: '2026-08-22T11:00:00.000Z',
    updated_at: '2026-08-22T11:00:00.000Z'
  }
];

export const MOCK_ENGAGEMENTS: IndustryEngagement[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
    industry_id: 'a1000000-0000-0000-0000-000000000005',
    engagement_type: 'funding',
    status: 'accepted',
    proposal_notes: 'Tata Steel CSR Foundation commits Rs 5,50,000 grant for filter manufacturing, fabrication tooling, and field deployment in Dumka.',
    created_at: '2026-08-24T12:00:00.000Z',
    updated_at: '2026-08-26T10:00:00.000Z',
    industry: MOCK_INSTITUTIONS[4]
  },
  {
    id: 'e1000000-0000-0000-0000-000000000002',
    challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123458',
    industry_id: 'a1000000-0000-0000-0000-000000000006',
    engagement_type: 'technology',
    status: 'pending',
    proposal_notes: 'CCL Innovation Cell offers direct pilot testing site access in Jharia opencast area and bio-slurry spraying equipment.',
    created_at: '2026-08-27T14:30:00.000Z',
    updated_at: '2026-08-27T14:30:00.000Z',
    industry: MOCK_INSTITUTIONS[5]
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1000000-0000-0000-0000-000000000001',
    recipient_id: 'u0000000-0000-0000-0000-000000000004',
    type: 'challenge_routed',
    payload: {
      challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
      title: 'New High Priority Challenge Routed: Arsenic in Dumka',
      message: 'Google AI Gemma classified challenge with 88.5 priority severity and assigned to BIT Sindri Chemical Dept.'
    },
    read_status: false,
    created_at: '2026-08-22T10:05:00.000Z'
  },
  {
    id: 'n1000000-0000-0000-0000-000000000002',
    recipient_id: 'u0000000-0000-0000-0000-000000000004',
    type: 'engagement_received',
    payload: {
      challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
      title: 'Tata Steel CSR Offered Rs 5.5L Grant',
      message: 'Tata Steel CSR Foundation proposed funding for Dumka Water filtration project.'
    },
    read_status: false,
    created_at: '2026-08-24T12:05:00.000Z'
  },
  {
    id: 'n1000000-0000-0000-0000-000000000003',
    recipient_id: 'u0000000-0000-0000-0000-000000000005',
    type: 'milestone_approved',
    payload: {
      challenge_id: 'b3e0d2e8-4567-4a89-8012-9c8e7f123456',
      title: 'Phase 1 Deliverable Approved',
      message: 'Dean approved Phase 1 Water Quality Analysis deliverable.'
    },
    read_status: true,
    created_at: '2026-08-26T15:35:00.000Z'
  }
];

export const MOCK_ANALYTICS_OVERVIEW: AnalyticsOverview = {
  total_challenges: 148,
  by_status: {
    submitted: 24,
    under_review: 12,
    routed: 42,
    team_formed: 28,
    in_progress: 26,
    completed: 11,
    validated: 5
  },
  total_institutions: 7,
  active_teams: 34,
  total_milestones: 98,
  resolved_challenges: 16,
  csr_funding_committed: 4250000
};

export const MOCK_DISTRICT_ANALYTICS: DistrictAnalytics[] = JHARKHAND_DISTRICTS.map((district, idx) => {
  const total = 4 + (idx * 7) % 18;
  const resolved = Math.floor(total * 0.25);
  const in_progress = Math.floor(total * 0.45);
  return {
    district,
    total_challenges: total,
    resolved_challenges: resolved,
    in_progress_challenges: in_progress,
    high_priority_count: Math.floor(total * 0.35),
    active_universities: 1 + (idx % 3)
  };
});

export const MOCK_CATEGORY_ANALYTICS: CategoryAnalytics[] = MOCK_CATEGORIES.map((cat, idx) => {
  const total = 10 + (idx * 4) % 22;
  const comp = Math.floor(total * 0.3);
  return {
    category_id: cat.id,
    name: cat.name,
    slug: cat.slug,
    total_challenges: total,
    completed_challenges: comp,
    completion_rate_percentage: Math.round((comp / total) * 100)
  };
});

export const MOCK_INSTITUTION_LEADERBOARD: InstitutionLeaderboardItem[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Birsa Institute of Technology (BIT) Sindri',
    type: 'university',
    district: 'Dhanbad',
    assigned_challenges_count: 38,
    completed_challenges_count: 14,
    active_teams_count: 12
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    name: 'National Institute of Technology (NIT) Jamshedpur',
    type: 'university',
    district: 'East Singhbhum',
    assigned_challenges_count: 31,
    completed_challenges_count: 11,
    active_teams_count: 9
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Birsa Agricultural University (BAU)',
    type: 'university',
    district: 'Ranchi',
    assigned_challenges_count: 27,
    completed_challenges_count: 9,
    active_teams_count: 7
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    name: 'Rajendra Institute of Medical Sciences (RIMS)',
    type: 'university',
    district: 'Ranchi',
    assigned_challenges_count: 19,
    completed_challenges_count: 6,
    active_teams_count: 4
  }
];

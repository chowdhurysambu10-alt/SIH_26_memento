-- 003_seed_data.sql
-- Seed 10 core categories and initial Jharkhand institutions

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Education', 'education', 'Primary, secondary, vocational training, smart classrooms, and digital literacy in rural & tribal areas.'),
    ('c1000000-0000-0000-0000-000000000002', 'Agriculture', 'agriculture', 'Crop protection, soil health, drip irrigation, post-harvest storage, and millet mission.'),
    ('c1000000-0000-0000-0000-000000000003', 'Healthcare', 'healthcare', 'Primary health centers, maternal care, telemedicine, tribal nutrition, and endemic disease control.'),
    ('c1000000-0000-0000-0000-000000000004', 'Water & Sanitation', 'water', 'Drinking water access, groundwater recharge, pond revival, and Jal Jeevan Mission monitoring.'),
    ('c1000000-0000-0000-0000-000000000005', 'Environment & Forestry', 'environment', 'Forest conservation, mine reclamation, pollution tracking, and biodiversity preservation.'),
    ('c1000000-0000-0000-0000-000000000006', 'Clean Energy', 'energy', 'Solar mini-grids, biomass power, clean cooking fuels, and renewable storage.'),
    ('c1000000-0000-0000-0000-000000000007', 'Urban Infrastructure', 'urban_development', 'Traffic management, waste segregation, stormwater drainage, and smart streetlighting in cities.'),
    ('c1000000-0000-0000-0000-000000000008', 'Accessibility & Inclusion', 'accessibility', 'Assistive technologies for persons with disabilities, elder care, and accessible public infrastructure.'),
    ('c1000000-0000-0000-0000-000000000009', 'Public Administration', 'public_administration', 'Grievance redressal, direct benefit transfer auditing, citizen charter tracking, and transparent ULB portals.'),
    ('c1000000-0000-0000-0000-000000000010', 'Rural Livelihoods', 'rural_livelihoods', 'Lac cultivation, silk weaving, minor forest produce processing, SHG market linkages, and handicrafts.')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Insert Jharkhand Institutions (Universities, Industry, Govt)
INSERT INTO institutions (id, name, type, domain_expertise, location, district, contact_email) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'Birsa Institute of Technology (BIT) Sindri',
        'university',
        ARRAY['engineering', 'environment', 'energy', 'water', 'urban_development'],
        'Dhanbad, Jharkhand',
        'Dhanbad',
        'innovations@bitsindri.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'Birsa Agricultural University (BAU)',
        'university',
        ARRAY['agriculture', 'rural_livelihoods', 'water', 'environment'],
        'Kanke, Ranchi, Jharkhand',
        'Ranchi',
        'vc@bauranchi.org'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        'National Institute of Technology (NIT) Jamshedpur',
        'university',
        ARRAY['technology', 'education', 'accessibility', 'energy', 'urban_development'],
        'Adityapur, Jamshedpur, Jharkhand',
        'East Singhbhum',
        'dean.rnc@nitjsr.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000004',
        'Rajendra Institute of Medical Sciences (RIMS)',
        'university',
        ARRAY['healthcare', 'nutrition', 'tribal_health', 'accessibility'],
        'Bariatu, Ranchi, Jharkhand',
        'Ranchi',
        'director@rimsranchi.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000005',
        'Tata Steel CSR Foundation',
        'industry',
        ARRAY['rural_livelihoods', 'healthcare', 'education', 'water'],
        'Jamshedpur, Jharkhand',
        'East Singhbhum',
        'csr@tatasteel.com'
    ),
    (
        'a1000000-0000-0000-0000-000000000006',
        'Central Coalfields Limited (CCL) Innovation Cell',
        'industry',
        ARRAY['environment', 'clean_energy', 'mine_reclamation', 'water'],
        'Darbhanga House, Ranchi, Jharkhand',
        'Ranchi',
        'csr.ccl@coalindia.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000007',
        'Jharkhand State Livelihood Promotion Society (JSLPS)',
        'govt',
        ARRAY['rural_livelihoods', 'agriculture', 'women_empowerment', 'shg'],
        'Ranchi, Jharkhand',
        'Ranchi',
        'support@jslps.in'
    )
ON CONFLICT (id) DO NOTHING;

export type UserRole =
  | 'citizen'
  | 'pri_ulb_official'
  | 'university_admin'
  | 'faculty'
  | 'student'
  | 'industry_partner'
  | 'govt_viewer'
  | 'super_admin';

export type InstitutionType = 'university' | 'industry' | 'govt';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  domain_expertise: string[];
  location: string;
  district: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  org_id?: string;
  district?: string;
  contact?: string;
  verified: boolean;
  institution?: Institution;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export interface AuthResponse {
  user: User;
  session: AuthSession;
}

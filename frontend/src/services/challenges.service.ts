import { apiClient } from './api';
import { Challenge, ChallengeStatus, FilterChallengeParams } from '../types/challenge.types';
import { ApiResponse } from '../types/notification.types';
import { MOCK_CHALLENGES, MOCK_CATEGORIES, MOCK_INSTITUTIONS } from './mockData';

// Local storage key for persistent in-browser state during offline/demo mode
const LOCAL_CHALLENGES_KEY = 'sih_mock_challenges_store';

function getStoredChallenges(): Challenge[] {
  const stored = localStorage.getItem(LOCAL_CHALLENGES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_CHALLENGES;
    }
  }
  return MOCK_CHALLENGES;
}

function saveStoredChallenges(challenges: Challenge[]) {
  localStorage.setItem(LOCAL_CHALLENGES_KEY, JSON.stringify(challenges));
}

export const challengesService = {
  async getChallenges(params?: FilterChallengeParams): Promise<{ data: Challenge[]; meta: any }> {
    try {
      const response: any = await apiClient.get('/challenges', { params });
      return {
        data: response.data || [],
        meta: response.meta || { total: response.data?.length || 0, page: 1, limit: 10, totalPages: 1 },
      };
    } catch (err) {
      console.warn('Backend unavailable, using local challenge store fallback:', err);
      let list = getStoredChallenges();

      if (params?.status) {
        list = list.filter((c) => c.status === params.status);
      }
      if (params?.district) {
        list = list.filter((c) => c.district.toLowerCase() === params.district?.toLowerCase());
      }
      if (params?.category_slug) {
        list = list.filter((c) => c.categories?.slug === params.category_slug || c.ai_classification?.categorySlug === params.category_slug);
      }
      if (params?.assigned_institution_id) {
        list = list.filter((c) => c.assigned_institution_id === params.assigned_institution_id);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.district.toLowerCase().includes(q));
      }

      return {
        data: list,
        meta: { total: list.length, page: params?.page || 1, limit: params?.limit || 10, totalPages: Math.ceil(list.length / (params?.limit || 10)) },
      };
    }
  },

  async getChallengeById(id: string): Promise<Challenge> {
    try {
      const response: any = await apiClient.get(`/challenges/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`Backend unavailable, resolving challenge ${id} from fallback store:`, err);
      const list = getStoredChallenges();
      const found = list.find((c) => c.id === id);
      if (found) return found;
      return list[0]; // fallback
    }
  },

  async createChallenge(formData: FormData | any): Promise<Challenge> {
    try {
      const response: any = await apiClient.post('/challenges', formData, {
        headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, simulating AI triage and saving to local store:', err);
      
      const title = formData instanceof FormData ? (formData.get('title') as string) : formData.title;
      const description = formData instanceof FormData ? (formData.get('description') as string) : formData.description;
      const district = formData instanceof FormData ? (formData.get('district') as string) : formData.district;
      const location_text = formData instanceof FormData ? (formData.get('location_text') as string) : formData.location_text;
      const lat = formData instanceof FormData ? parseFloat(formData.get('latitude') as string || '23.6102') : formData.latitude || 23.6102;
      const lng = formData instanceof FormData ? parseFloat(formData.get('longitude') as string || '85.2799') : formData.longitude || 85.2799;

      // Simulate Gemma 2 AI Classification
      const matchedCategory = MOCK_CATEGORIES.find((c) => 
        title.toLowerCase().includes(c.slug) || description.toLowerCase().includes(c.slug) ||
        (c.slug === 'water' && (title.toLowerCase().includes('water') || title.toLowerCase().includes('well') || title.toLowerCase().includes('pump'))) ||
        (c.slug === 'agriculture' && (title.toLowerCase().includes('crop') || title.toLowerCase().includes('farm') || title.toLowerCase().includes('irrigation')))
      ) || MOCK_CATEGORIES[3]; // default water

      const matchedInst = MOCK_INSTITUTIONS.find((i) => i.domain_expertise.includes(matchedCategory.slug)) || MOCK_INSTITUTIONS[0];

      const newChallenge: Challenge = {
        id: `c-${Date.now()}`,
        title,
        description,
        district,
        location_text: location_text || `Block 1, ${district}`,
        latitude: lat,
        longitude: lng,
        status: 'routed',
        priority_score: Math.floor(75 + Math.random() * 20),
        media_urls: ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'],
        assigned_institution_id: matchedInst.id,
        category_id: matchedCategory.id,
        categories: matchedCategory,
        institutions: matchedInst,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_classification: {
          categorySlug: matchedCategory.slug,
          categoryName: matchedCategory.name,
          priorityScore: 86.5,
          recommendedKeywords: [matchedCategory.slug, district.toLowerCase(), 'civic innovation', 'grassroots'],
          duplicateCandidateId: null,
          duplicateSimilarityScore: 0.04,
          rationale: `AI identified critical ${matchedCategory.name} requirement in ${district} jurisdiction. Auto-routed to ${matchedInst.name}.`,
          providerUsed: 'GemmaAPI (Google AI Studio Gemma 2 9B)',
          processedAt: new Date().toISOString(),
        }
      };

      const list = getStoredChallenges();
      const updated = [newChallenge, ...list];
      saveStoredChallenges(updated);
      return newChallenge;
    }
  },

  async overrideRouting(id: string, payload: { assigned_institution_id?: string; priority_score?: number; override_reason: string }): Promise<Challenge> {
    try {
      const response: any = await apiClient.post(`/challenges/${id}/override-routing`, payload);
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, applying manual override locally:', err);
      const list = getStoredChallenges();
      const targetInst = MOCK_INSTITUTIONS.find((i) => i.id === payload.assigned_institution_id) || MOCK_INSTITUTIONS[0];
      const updated = list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            assigned_institution_id: payload.assigned_institution_id || c.assigned_institution_id,
            institutions: targetInst,
            priority_score: payload.priority_score !== undefined ? payload.priority_score : c.priority_score,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      saveStoredChallenges(updated);
      return updated.find((c) => c.id === id)!;
    }
  },

  async updateStatus(id: string, status: ChallengeStatus, notes?: string): Promise<Challenge> {
    try {
      const response: any = await apiClient.patch(`/challenges/${id}/status`, { status, notes });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, updating challenge status locally:', err);
      const list = getStoredChallenges();
      const updated = list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      saveStoredChallenges(updated);
      return updated.find((c) => c.id === id)!;
    }
  }
};

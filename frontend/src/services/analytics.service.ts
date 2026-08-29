import { apiClient } from './api';
import { AnalyticsOverview, CategoryAnalytics, DistrictAnalytics, InstitutionLeaderboardItem } from '../types/analytics.types';
import { MOCK_ANALYTICS_OVERVIEW, MOCK_CATEGORY_ANALYTICS, MOCK_DISTRICT_ANALYTICS, MOCK_INSTITUTION_LEADERBOARD } from './mockData';

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    try {
      const response: any = await apiClient.get('/analytics/overview');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using fallback analytics overview:', err);
      return MOCK_ANALYTICS_OVERVIEW;
    }
  },

  async getByCategory(): Promise<CategoryAnalytics[]> {
    try {
      const response: any = await apiClient.get('/analytics/by-category');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using fallback category analytics:', err);
      return MOCK_CATEGORY_ANALYTICS;
    }
  },

  async getByDistrict(): Promise<DistrictAnalytics[]> {
    try {
      const response: any = await apiClient.get('/analytics/by-district');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using fallback district analytics:', err);
      return MOCK_DISTRICT_ANALYTICS;
    }
  },

  async getInstitutions(): Promise<InstitutionLeaderboardItem[]> {
    try {
      const response: any = await apiClient.get('/analytics/institutions');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using fallback institutions leaderboard:', err);
      return MOCK_INSTITUTION_LEADERBOARD;
    }
  }
};

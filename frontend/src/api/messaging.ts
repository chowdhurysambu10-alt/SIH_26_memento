import { apiClient } from './client';

export interface TempMessage {
  id: string;
  sender_id: string;
  encrypted_subject: string;
  encrypted_body: string;
  created_at: string;
  sender?: {
    full_name?: string;
    email?: string;
  };
}

export const messagingApi = {
  generateAlias: async (publicKey: string): Promise<{ alias_id: string }> => {
    const response = await apiClient<{ alias_id: string }>('/messaging/alias', { 
      method: 'POST',
      body: JSON.stringify({ publicKey })
    });
    return response;
  },

  getAlias: async (): Promise<{ alias_id: string } | null> => {
    try {
      const response = await apiClient<{ alias_id: string }>('/messaging/alias', { method: 'GET' });
      // If it returns empty or 404, we might not have an alias
      return response || null;
    } catch (e) {
      return null;
    }
  },

  deleteAlias: async (): Promise<void> => {
    await apiClient('/messaging/alias', { method: 'DELETE', suppressGlobalError: true });
  },

  getPublicKey: async (aliasId: string): Promise<{ public_key: string }> => {
    const response = await apiClient<{ public_key: string }>(`/messaging/public-key/${aliasId}`, { method: 'GET' });
    return response;
  },

  sendMessage: async (recipientAliasId: string, encryptedSubject: string, encryptedBody: string): Promise<void> => {
    await apiClient('/messaging/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientAliasId,
        encryptedSubject,
        encryptedBody,
      }),
    });
  },

  getInbox: async (): Promise<TempMessage[]> => {
    const response = await apiClient<TempMessage[]>('/messaging/inbox', { method: 'GET' });
    return response;
  },
};

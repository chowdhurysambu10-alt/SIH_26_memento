import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X, Loader2 } from 'lucide-react';

interface AlertOptions {
  message: string;
  type?: 'info' | 'error' | 'success';
}

interface UIContextType {
  showAlert: (message: string, type?: 'info' | 'error' | 'success') => void;
  showConfirm: (message: string) => Promise<boolean>;
  setGlobalLoading: (isLoading: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: 'info' | 'error' | 'success' }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; message: string; resolve: ((value: boolean) => void) | null }>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const showAlert = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertState({ isOpen: true, message, type });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback((result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirmState]);

  const setGlobalLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <UIContext.Provider value={{ showAlert, showConfirm, setGlobalLoading }}>
      {children}

      {/* Global Loader */}
      {isLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff', padding: '24px 32px', borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
          }}>
            <Loader2 size={36} color="#2563eb" className="animate-spin" />
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>Processing...</span>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertState.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {alertState.type === 'error' && <AlertCircle color="#ef4444" size={24} />}
                {alertState.type === 'success' && <CheckCircle color="#10b981" size={24} />}
                {alertState.type === 'info' && <Info color="#3b82f6" size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {alertState.type === 'error' ? 'Error' : alertState.type === 'success' ? 'Success' : 'Information'}
                </h3>
                <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: 1.5 }}>
                  {alertState.message}
                </p>
              </div>
              <button onClick={closeAlert} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={closeAlert}
                style={{
                  background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 24px',
                  borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '2px', background: '#fee2e2', padding: '8px', borderRadius: '50%' }}>
                <AlertCircle color="#ef4444" size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Confirmation Required
                </h3>
                <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: 1.5 }}>
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => handleConfirm(false)}
                style={{
                  background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px',
                  borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(true)}
                style={{
                  background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 24px',
                  borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

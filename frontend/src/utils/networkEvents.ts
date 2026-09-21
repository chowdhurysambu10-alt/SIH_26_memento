// Simple event emitter for network state tracking

export const NETWORK_EVENTS = {
  START: 'memento:network:start',
  END: 'memento:network:end',
  ERROR: 'memento:network:error'
};

export const dispatchNetworkStart = () => {
  queueMicrotask(() => {
    window.dispatchEvent(new Event(NETWORK_EVENTS.START));
  });
};

export const dispatchNetworkEnd = () => {
  queueMicrotask(() => {
    window.dispatchEvent(new Event(NETWORK_EVENTS.END));
  });
};

export const dispatchNetworkError = (errorMsg: string) => {
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.ERROR, { detail: { message: errorMsg } }));
  });
};

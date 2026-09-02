// Simple event emitter for network state tracking

export const NETWORK_EVENTS = {
  START: 'memento:network:start',
  END: 'memento:network:end',
  ERROR: 'memento:network:error'
};

export const dispatchNetworkStart = () => {
  window.dispatchEvent(new Event(NETWORK_EVENTS.START));
};

export const dispatchNetworkEnd = () => {
  window.dispatchEvent(new Event(NETWORK_EVENTS.END));
};

export const dispatchNetworkError = (errorMsg: string) => {
  window.dispatchEvent(new CustomEvent(NETWORK_EVENTS.ERROR, { detail: { message: errorMsg } }));
};

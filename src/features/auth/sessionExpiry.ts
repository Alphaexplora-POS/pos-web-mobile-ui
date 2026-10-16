export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const SIGNED_IN_FLAG = 'pos_signed_in';

export const markSignedIn = () => {
  try {
    window.localStorage.setItem(SIGNED_IN_FLAG, '1');
  } catch {
    /* storage unavailable */
  }
};

export const clearSignedIn = () => {
  try {
    window.localStorage.removeItem(SIGNED_IN_FLAG);
  } catch {
    /* storage unavailable */
  }
};

export const hasBeenSignedIn = (): boolean => {
  try {
    return window.localStorage.getItem(SIGNED_IN_FLAG) === '1';
  } catch {
    return false;
  }
};

export const notifySessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
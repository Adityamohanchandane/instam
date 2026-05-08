const SESSION_KEY = 'vibesync_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    // Fallback for browsers that don't support crypto.randomUUID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      // Fallback implementation
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

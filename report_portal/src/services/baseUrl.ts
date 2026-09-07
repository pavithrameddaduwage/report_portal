export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:4009`;
  }
  return 'http://localhost:4009';
};

export const baseUrl = getBaseUrl();
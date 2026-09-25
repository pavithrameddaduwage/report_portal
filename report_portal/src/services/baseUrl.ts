export const getBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (process.env.NEXT_PUBLIC_INTEGRATION_API_URL) return process.env.NEXT_PUBLIC_INTEGRATION_API_URL;
    if (process.env.INTEGRATION_API_URL) return process.env.INTEGRATION_API_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4009';
    }
    return 'https://hbs.hgusa.com/api/report-portal';
  }
  return 'https://hbs.hgusa.com/api/report-portal';
};

export const baseUrl = getBaseUrl();
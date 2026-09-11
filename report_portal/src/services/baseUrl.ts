export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `https://hbs.hgusa.com/api/report-portal`;
  }
  return 'https://hbs.hgusa.com/api/report-portal';
};

export const baseUrl = getBaseUrl();
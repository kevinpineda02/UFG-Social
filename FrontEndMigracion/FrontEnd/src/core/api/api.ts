export const API_BASE_URL = 'https://ufg-social-1.onrender.com';

export function resolverUrlMedia(
  url: string | null | undefined,
  valorPorDefecto = ''
): string {
  if (!url) {
    return valorPorDefecto;
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}
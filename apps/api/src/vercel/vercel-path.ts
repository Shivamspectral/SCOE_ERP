export const ORIGINAL_VERCEL_PATH_PARAM = '__vercel_original_path';

export function restoreOriginalVercelPath(request: { url?: string }): void {
  if (!request.url) return;

  const rewrittenUrl = new URL(request.url, 'http://vercel.internal');
  const originalPath = rewrittenUrl.searchParams.get(ORIGINAL_VERCEL_PATH_PARAM);
  if (!originalPath || !originalPath.startsWith('/')) return;

  rewrittenUrl.searchParams.delete(ORIGINAL_VERCEL_PATH_PARAM);
  const remainingQuery = rewrittenUrl.searchParams.toString();
  request.url = `${originalPath}${remainingQuery ? `?${remainingQuery}` : ''}`;
}

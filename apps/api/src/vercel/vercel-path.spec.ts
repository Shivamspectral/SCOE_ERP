import { restoreOriginalVercelPath } from './vercel-path';

describe('restoreOriginalVercelPath', () => {
  it('restores the original API route and preserves caller query parameters', () => {
    const request = { url: '/api/index?__vercel_original_path=%2Fapi%2Fv1%2Fhealth&from=2026-10-01&to=2026-10-28' };
    restoreOriginalVercelPath(request);
    expect(request.url).toBe('/api/v1/health?from=2026-10-01&to=2026-10-28');
  });

  it('leaves requests without the rewrite marker unchanged', () => {
    const request = { url: '/api/index?existing=1' };
    restoreOriginalVercelPath(request);
    expect(request.url).toBe('/api/index?existing=1');
  });
});

/**
 * Extracted so the URL-gate check can be imported in the main bundle
 * without dragging in the heavy AssetLibraryScreen + all its sprite /
 * frame / icon imports (M64 code-split).
 */
export function isStyleGuideRequested(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('style-guide') === '1';
  } catch {
    return false;
  }
}

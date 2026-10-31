export function needsSharedSidebar(pathname, isShop = false) {
  return /^\/dashboard(?:\/|$)/.test(pathname || '') && (isShop || pathname !== '/dashboard');
}

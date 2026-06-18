/** Routes where an old local session must not block SSO code exchange. */
export function isAuthFlowPath(pathname = globalThis.location?.pathname || '') {
  return /^\/auth\/(callback|complete-registration)/.test(pathname);
}

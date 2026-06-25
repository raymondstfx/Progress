export function currentPath(): string {
  return window.location.pathname === "/" ? "/login" : window.location.pathname;
}

export function navigate(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("popstate"));
}

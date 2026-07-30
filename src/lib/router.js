export function parseRoute(route) {
  if (route === "/") {
    return { type: "home" };
  }

  if (route === "/contact") {
    return { type: "contact" };
  }

  const workMatch = route.match(/^\/works\/([^/]+)$/);
  if (workMatch) {
    return { type: "work", slug: workMatch[1] };
  }

  const tagMatch = route.match(/^\/tags\/([^/]+)$/);
  if (tagMatch) {
    return { type: "tag", slug: tagMatch[1] };
  }

  const songMatch = route.match(/^\/songs\/([^/]+)$/);
  if (songMatch) {
    return { type: "song", slug: songMatch[1] };
  }

  return { type: "not-found" };
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

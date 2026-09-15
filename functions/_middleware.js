/**
 * The production *.pages.dev address is not a public copy of the site: send
 * it to the canonical domain with a permanent redirect, keeping the path and
 * query. Branch previews (<hash>.hbi-studio.pages.dev, <branch>.hbi-studio.pages.dev)
 * keep serving as they are.
 */
const PRODUCTION_ALIAS = 'hbi-studio.pages.dev';
const CANONICAL = 'https://hbi-studio.com';

export const onRequest = ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname === PRODUCTION_ALIAS) {
    return Response.redirect(CANONICAL + url.pathname + url.search, 301);
  }
  return next();
};

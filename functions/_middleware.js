/**
 * The production *.pages.dev address is not a public copy of the site: send
 * it to the canonical domain with a permanent redirect, keeping the path and
 * query. Branch previews (<hash>.hbi-studio.pages.dev, <branch>.hbi-studio.pages.dev)
 * keep serving as they are.
 */
const PRODUCTION_ALIAS = 'hbi-studio.pages.dev';
const CANONICAL = 'https://hbi-studio.com';
const SHORT_LINKS = ['/ig', '/tt', '/g', '/yelp', '/fb', '/b'];

export const onRequest = ({ request, next }) => {
  const url = new URL(request.url);
  if (url.hostname === PRODUCTION_ALIAS) {
    return Response.redirect(CANONICAL + url.pathname + url.search, 301);
  }
  // Bing Places copies the website (/g) from Google and can only append a tag
  // to it; _redirects drops that query, so honour an explicit utm_source here.
  const src = url.searchParams.get('utm_source');
  if (src && SHORT_LINKS.includes(url.pathname)) {
    return Response.redirect(CANONICAL + '/?utm_source=' + encodeURIComponent(src), 302);
  }
  return next();
};

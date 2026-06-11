import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'mn'],
  defaultLocale: 'mn',
});

export const config = {
  matcher: ['/((?!_next|.*\\..*|api|opengraph-image|robots|sitemap).*)'],
};

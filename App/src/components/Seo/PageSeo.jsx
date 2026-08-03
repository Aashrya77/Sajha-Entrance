import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { publicAPI } from '../../api/config';
import { isIndexablePath } from './routeIndexing';

const DEFAULT_TITLE = 'Sajha Entrance';
const DEFAULT_DESCRIPTION = 'Sajha Entrance is an educational institute for entrance preparation in Nepal.';

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);

  if (!value) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, selector.match(/["']([^"']+)["']/)?.[1] || '');
    document.head.appendChild(element);
  }

  element.setAttribute('content', value);
};

const setNamedMeta = (name, value) => setMeta(`meta[name="${name}"]`, 'name', value);
const setPropertyMeta = (property, value) => setMeta(`meta[property="${property}"]`, 'property', value);

const setCanonical = (value) => {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!value) {
    canonical?.remove();
    return;
  }
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', value);
};

const applySeo = (seo, pathname) => {
  const indexable = isIndexablePath(pathname);
  const title = seo?.title || DEFAULT_TITLE;
  const description = seo?.description || DEFAULT_DESCRIPTION;
  const robots = indexable
    ? (seo?.robots || 'index, follow')
    : 'noindex, nofollow, noarchive';
  const canonical = indexable
    ? (seo?.canonicalUrl || `${window.location.origin}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`)
    : '';
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;

  document.title = title;
  setNamedMeta('description', description);
  setNamedMeta('keywords', seo?.keywords || '');
  setNamedMeta('robots', robots);
  setNamedMeta('googlebot', robots);
  setCanonical(canonical);
  setPropertyMeta('og:title', ogTitle);
  setPropertyMeta('og:description', ogDescription);
  setPropertyMeta('og:type', 'website');
  setPropertyMeta('og:url', canonical);
  setPropertyMeta('og:image', seo?.ogImage || '');
  setNamedMeta('twitter:card', seo?.twitterCard || (seo?.ogImage ? 'summary_large_image' : 'summary'));
  setNamedMeta('twitter:title', ogTitle);
  setNamedMeta('twitter:description', ogDescription);
  setNamedMeta('twitter:image', seo?.ogImage || '');
};

const PageSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    // Reset immediately so metadata from the previous route never remains visible.
    applySeo(null, pathname);

    publicAPI
      .get('/seo/page', { params: { path: pathname }, signal: controller.signal })
      .then(({ data }) => applySeo(data?.seo || null, pathname))
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') applySeo(null, pathname);
      });

    return () => controller.abort();
  }, [pathname]);

  return null;
};

export default PageSeo;

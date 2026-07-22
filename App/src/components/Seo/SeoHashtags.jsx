import { useEffect } from 'react';
import { publicAPI } from '../../api/config';

const FALLBACK_KEYWORDS =
  'Sajha Entrance, entrance preparation, CSIT, BIT, CMAT, BCA, engineering entrance Nepal';

const SeoHashtags = () => {
  useEffect(() => {
    let isMounted = true;

    publicAPI
      .get('/seo/hashtags')
      .then(({ data }) => {
        if (!isMounted || !Array.isArray(data?.hashtags) || data.hashtags.length === 0) return;

        const content = data.hashtags
          .map((hashtag) => String(hashtag).replace(/^#+/, '').trim())
          .filter(Boolean)
          .join(', ');
        const meta = document.querySelector('meta[name="keywords"]');
        if (meta && content) meta.setAttribute('content', content);
      })
      .catch(() => {
        const meta = document.querySelector('meta[name="keywords"]');
        if (meta && !meta.getAttribute('content')) meta.setAttribute('content', FALLBACK_KEYWORDS);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
};

export default SeoHashtags;

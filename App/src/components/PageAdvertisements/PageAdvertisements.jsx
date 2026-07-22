import { useEffect, useState } from 'react';
import { advertisementAPI } from '../../api/services';
import { getImageFieldUrl } from '../../utils/imageHelper';
import './PageAdvertisements.css';

const PageAdvertisements = ({ page }) => {
  const [advertisements, setAdvertisements] = useState([]);

  useEffect(() => {
    let isCurrent = true;

    advertisementAPI
      .getForPage(page)
      .then((response) => {
        if (isCurrent && response.data?.success) {
          setAdvertisements(response.data.data || []);
        }
      })
      .catch(() => {
        if (isCurrent) setAdvertisements([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [page]);

  const visibleAdvertisements = advertisements.filter((advertisement) =>
    Boolean(getImageFieldUrl(advertisement, 'advertisementFile', 'advertisement'))
  );

  if (!visibleAdvertisements.length) {
    return null;
  }

  return (
    <section className="page-advertisements" aria-label="Sponsored advertisements">
      <div className="page-advertisements__rail">
        {visibleAdvertisements.map((advertisement) => {
          const imageUrl = getImageFieldUrl(
            advertisement,
            'advertisementFile',
            'advertisement'
          );
          const content = (
            <img
              src={imageUrl}
              alt={advertisement.advertisementName || 'Advertisement'}
              className="page-advertisements__image"
              loading="lazy"
              decoding="async"
            />
          );

          return advertisement.advertisementLink ? (
            <a
              key={advertisement._id}
              href={advertisement.advertisementLink}
              className="page-advertisements__item"
              target={advertisement.advertisementLink.startsWith('/') ? undefined : '_blank'}
              rel={advertisement.advertisementLink.startsWith('/') ? undefined : 'noreferrer'}
            >
              {content}
            </a>
          ) : (
            <div key={advertisement._id} className="page-advertisements__item">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PageAdvertisements;

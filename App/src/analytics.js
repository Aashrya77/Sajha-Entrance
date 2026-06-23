const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

export const isAnalyticsEnabled = () => Boolean(GA_MEASUREMENT_ID && typeof window !== "undefined");

export const loadGoogleAnalytics = () => {
  if (!isAnalyticsEnabled() || document.getElementById("ga-script")) {
    return;
  }

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script1.id = "ga-script";

  const script2 = document.createElement("script");
  script2.id = "ga-inline-script";
  script2.innerHTML = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });`;

  document.head.appendChild(script1);
  document.head.appendChild(script2);
};

export const trackPageView = (path) => {
  if (!isAnalyticsEnabled() || typeof window.gtag !== "function") {
    return;
  }

  try {
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: path });
  } catch (_error) {
    // ignore analytics errors
  }
};

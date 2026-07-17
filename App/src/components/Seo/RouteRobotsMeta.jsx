import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isIndexablePath } from "./routeIndexing";

const upsertRobotsMeta = (name, content) => {
  let meta = document.head.querySelector(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
};

const RouteRobotsMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const content = isIndexablePath(pathname)
      ? "index, follow"
      : "noindex, nofollow, noarchive";

    upsertRobotsMeta("robots", content);
    upsertRobotsMeta("googlebot", content);
  }, [pathname]);

  return null;
};

export default RouteRobotsMeta;

const ADMIN_ROOT_PATH = "/sajha-admin";

const resolveAdminRootPath = () => {
  if (typeof window !== "undefined") {
    return window.REDUX_STATE?.paths?.rootPath || ADMIN_ROOT_PATH;
  }

  return ADMIN_ROOT_PATH;
};

const buildAdminPath = (pathname = "") => {
  const rootPath = resolveAdminRootPath().replace(/\/$/, "");

  if (!pathname) {
    return rootPath;
  }

  const normalizedPath = `/${String(pathname).replace(/^\/+/, "")}`;
  return `${rootPath}${normalizedPath}`;
};

export { ADMIN_ROOT_PATH, buildAdminPath, resolveAdminRootPath };

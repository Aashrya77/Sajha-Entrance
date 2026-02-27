import { ComponentLoader } from "adminjs";
import path from "path";
import { fileURLToPath } from "url";

const componentLoader = new ComponentLoader();

// Windows ma sahi path nikalna yo setup chaincha
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Components = {
  // path.join le garda aba AdminJS le file ko sahi location bhetauncha
  Dashboard: componentLoader.add("Dashboard", path.join(__dirname, "./components/Dashboard")),
};

export { Components };
export default componentLoader;
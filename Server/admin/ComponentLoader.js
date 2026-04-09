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
  BulkUploadResults: componentLoader.add(
    "BulkUploadResults",
    path.join(__dirname, "./components/BulkUploadResults")
  ),
  RichTextEditor: componentLoader.add(
    "RichTextEditor",
    path.join(__dirname, "./components/RichTextEditor")
  ),
  ImageUpload: componentLoader.add("ImageUpload", path.join(__dirname, "./components/ImageUpload")),
  Login: componentLoader.override("Login", path.join(__dirname, "./components/Login")),
  LoggedIn: componentLoader.override("LoggedIn", path.join(__dirname, "./components/LoggedIn")),
  TopBar: componentLoader.override("TopBar", path.join(__dirname, "./components/TopBar")),
  SidebarBranding: componentLoader.override("SidebarBranding", path.join(__dirname, "./components/SidebarBranding")),
};

export { Components };
export default componentLoader;

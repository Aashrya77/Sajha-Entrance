import { ComponentLoader } from "adminjs";
import path from "path";
import { fileURLToPath } from "url";

const componentLoader = new ComponentLoader();

// Windows ma sahi path nikalna yo setup chaincha
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Components = {
  ActionButton: componentLoader.override(
    "ActionButton",
    path.join(__dirname, "./components/adminjs/ActionButton")
  ),
  DefaultArrayShowProperty: componentLoader.override(
    "DefaultArrayShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultArrayShowProperty")
  ),
  DefaultBooleanShowProperty: componentLoader.override(
    "DefaultBooleanShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultBooleanShowProperty")
  ),
  DefaultCurrencyShowProperty: componentLoader.override(
    "DefaultCurrencyShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultCurrencyShowProperty")
  ),
  DefaultDatetimeShowProperty: componentLoader.override(
    "DefaultDatetimeShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultDatetimeShowProperty")
  ),
  DefaultMixedShowProperty: componentLoader.override(
    "DefaultMixedShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultMixedShowProperty")
  ),
  DefaultPhoneShowProperty: componentLoader.override(
    "DefaultPhoneShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultPhoneShowProperty")
  ),
  DefaultReferenceShowProperty: componentLoader.override(
    "DefaultReferenceShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultReferenceShowProperty")
  ),
  DefaultRichtextShowProperty: componentLoader.override(
    "DefaultRichtextShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultRichtextShowProperty")
  ),
  DefaultShowProperty: componentLoader.override(
    "DefaultShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultShowProperty")
  ),
  DefaultTextareaShowProperty: componentLoader.override(
    "DefaultTextareaShowProperty",
    path.join(__dirname, "./components/adminjs/DefaultTextareaShowProperty")
  ),
  PropertyLabel: componentLoader.override(
    "PropertyLabel",
    path.join(__dirname, "./components/adminjs/PropertyLabel")
  ),
  PropertyHeader: componentLoader.override(
    "PropertyHeader",
    path.join(__dirname, "./components/adminjs/PropertyHeader")
  ),
  // path.join le garda aba AdminJS le file ko sahi location bhetauncha
  Dashboard: componentLoader.add("Dashboard", path.join(__dirname, "./components/Dashboard")),
  BulkUploadResults: componentLoader.add(
    "BulkUploadResults",
    path.join(__dirname, "./components/BulkUploadResults")
  ),
  MockQuestionStudio: componentLoader.add(
    "MockQuestionStudio",
    path.join(__dirname, "./components/MockQuestionStudio")
  ),
  MockTestWorkspace: componentLoader.add(
    "MockTestWorkspace",
    path.join(__dirname, "./components/MockTestWorkspace")
  ),
  MockTestScheduler: componentLoader.add(
    "MockTestScheduler",
    path.join(__dirname, "./components/MockTestScheduler")
  ),
  RichTextEditor: componentLoader.add(
    "RichTextEditor",
    path.join(__dirname, "./components/RichTextEditor")
  ),
  RecordedClassEdit: componentLoader.add(
    "RecordedClassEdit",
    path.join(__dirname, "./components/RecordedClassEdit")
  ),
  OnlineClassCoursesEdit: componentLoader.add(
    "OnlineClassCoursesEdit",
    path.join(__dirname, "./components/OnlineClassCoursesEdit")
  ),
  OnlineClassCoursesDisplay: componentLoader.add(
    "OnlineClassCoursesDisplay",
    path.join(__dirname, "./components/OnlineClassCoursesDisplay")
  ),
  StudentsExport: componentLoader.add(
    "StudentsExport",
    path.join(__dirname, "./components/StudentsExport")
  ),
  AdminResourceSearch: componentLoader.add(
    "AdminResourceSearch",
    path.join(__dirname, "./components/AdminResourceSearch")
  ),
  ImageUpload: componentLoader.add("ImageUpload", path.join(__dirname, "./components/ImageUpload")),
  Login: componentLoader.override("Login", path.join(__dirname, "./components/Login")),
  LoggedIn: componentLoader.override("LoggedIn", path.join(__dirname, "./components/LoggedIn")),
  TopBar: componentLoader.override("TopBar", path.join(__dirname, "./components/TopBar")),
  SidebarBranding: componentLoader.override("SidebarBranding", path.join(__dirname, "./components/SidebarBranding")),
};

export { Components };
export default componentLoader;

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  createSitemapXml,
  getStaticSitemapEntries,
} from "../../Server/services/sitemapService.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, "../public/sitemap.xml");
const xml = createSitemapXml(getStaticSitemapEntries());

fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Generated ${outputPath}`);

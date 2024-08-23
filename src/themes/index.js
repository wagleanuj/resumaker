import ejs from "ejs";

import { upsertStyleTag } from "../lib/utils";
import { getRenderData, varNamePrimaryColor } from "./data";

// https://vitejs.dev/guide/features.html#disabling-css-injection-into-the-page
// note that `?raw` (https://vitejs.dev/guide/assets.html#importing-asset-as-string)
// cannot be used because we need vite to transform scss into css
const styleMoudules = import.meta.glob("./*/index.scss", { query: "?inline" });

export const themes = {};

themes["even"] = {
  template: await import("./flat/index.cjs"),
  styleModule: await import(`./reorx/index.scss`),
};

const themeNames = ["reorx"];

for (const name of themeNames) {
  let templateModule, styleModule;
  try {
    templateModule = await import(`./${name}/index.ejs`);
  } catch (err) {
    console.error("Could not find the theme module in ", `./${name}/index.ejs`);
  }
  if (!templateModule) {
    try {
      templateModule = await import(`jsonresume-theme-` + name);
    } catch (err) {
      console.error(
        "Could not find the theme module in ",
        `jsonresume-theme-` + name
      );
    }
  }

  // https://vitejs.dev/guide/features.html#glob-import
  styleModule = await styleMoudules[`./${name}/index.scss`]();

  themes[name] = {
    template: templateModule.default,
    style: styleModule.default,
  };
}

// set default
themes.default = themes.reorx;

export function getTheme(name) {
  return themes[name];
}

export function renderTheme(template, cvData, options) {
  return ejs.render(template, getRenderData(cvData), options);
}

const cvStyleId = "cv-style";

export function renderThemeOn(name, el, data, primaryColor) {
  const jsonString = JSON.stringify(data);
  console.log(jsonString);
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a File from Blob
  const file = new File([blob], "resume.json", { type: "application/json" });
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("theme", name);

  // Send FormData using fetch
  fetch("http://localhost:3000/resume", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.blob()) // Expecting PDF blob as response
    .then((blob) => {
      // Create a URL for the PDF blob and display it
      const url = URL.createObjectURL(blob);
      const pdfViewer = el;
      pdfViewer.innerHTML = `<embed src="${url}" type="application/pdf" width="100%" height="5000px">`;
    })
    .catch((error) => {
      console.error("Error:", error);
      el.innerText = "Error uploading resume.";
    });

  // const theme = getTheme(name);
  // el.innerHTML = renderTheme(theme.template, data);

  // upsertStyleTag(cvStyleId, theme.style);

  // document.documentElement.style.setProperty(varNamePrimaryColor, primaryColor);
}

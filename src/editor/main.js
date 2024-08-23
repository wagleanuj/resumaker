import "iconify-icon"; // import only

import $ from "cash-dom";
import dayjs from "dayjs";
import objectPath from "object-path";

import { JSONEditor } from "@json-editor/json-editor/dist/jsoneditor";

import * as sampleModule from "../../sample.cv.json";
import * as jsoncvSchemaModule from "../../schema/jsoncv.schema.json";
import {
  getCVData,
  getPrimaryColor,
  saveCVJSON,
  savePrimaryColor,
  saveTheme,
} from "../lib/store";
import {
  createElement,
  downloadContent,
  downloadIframeHTML,
  propertiesToObject,
  traverseDownObject,
} from "../lib/utils";
import { getCVTitle } from "../themes/data";
import { registerIconLib } from "./je-iconlib";
import { registerTheme } from "./je-theme";
import { renderThemeOn, themes } from "../themes";

const propertiesInOrder = [
  "basics",
  "education",
  "work",
  "projects",
  "sideProjects",
  "skills",
  "languages",
  "interests",
  "references",
  "awards",
  "publications",
  "volunteer",
  "certificates",
  "meta",
];
const basicsPropertiesInOrder = [
  "name",
  "label",
  "email",
  "phone",
  "url",
  "summary",
  "image",
  "location",
  "profiles",
];

// toc elements
const elToc = document.querySelector(".editor-toc");
const tocUl = createElement("ul", {
  parent: elToc,
});
const basicsUl = createElement("ul", {
  parent: tocUl,
});

// copy the object to remove the readonly restriction on module
const jsoncvSchema = { ...jsoncvSchemaModule.default };

// add propertyOrder to schema, and add links to toc
propertiesInOrder.forEach((name, index) => {
  jsoncvSchema.properties[name].propertyOrder = index;

  const li = createElement("li", { parent: tocUl });
  createElement("a", {
    text: name,
    attrs: {
      href: `#root.${name}`,
    },
    parent: li,
  });

  if (name === "basics") {
    li.appendChild(basicsUl);
  }
});
basicsPropertiesInOrder.forEach((name, index) => {
  jsoncvSchema.properties.basics.properties[name].propertyOrder = index;
  // only add location and profiles to basics toc
  if (!["location", "profiles"].includes(name)) return;
  const li = createElement("li", { parent: basicsUl });
  createElement("a", {
    text: name,
    attrs: {
      href: `#root.basics.${name}`,
    },
    parent: li,
  });
});

// add headerTemplate for each type:array in schema
traverseDownObject(jsoncvSchema, (key, obj) => {
  let noun = key;
  if (noun.endsWith("s")) noun = noun.slice(0, -1);
  if (obj.type === "array" && obj.items) {
    obj.items.headerTemplate = `${noun} {{i1}}`;
  }
});

// add format to schema
const keyFormatMap = {
  "basics.properties.summary": "textarea",
  "work.items.properties.description": "textarea",
  "work.items.properties.summary": "textarea",
  "work.items.properties.highlights.items": "textarea",
  "projects.items.properties.description": "textarea",
  "projects.items.properties.highlights.items": "textarea",
  "sideProjects.items.properties.description": "textarea",
  "skills.items.properties.summary": "textarea",
  "languages.items.properties.summary": "textarea",
  "references.items.properties.reference": "textarea",
  "awards.items.properties.summary": "textarea",
  "publications.items.properties.summary": "textarea",
  "volunteer.items.properties.summary": "textarea",
  "volunteer.items.properties.highlights.items": "textarea",
};
for (const [key, format] of Object.entries(keyFormatMap)) {
  objectPath.get(jsoncvSchema.properties, key).format = format;
}

// change schema title
jsoncvSchema.title = "CV Schema";

// change some descriptions
jsoncvSchema.properties.meta.properties.lastModified.description +=
  ". This will be automatically updated when downloading.";

// init data
let data = getCVData();
if (!data) data = sampleModule.default;
// initialize editor
registerTheme(JSONEditor);
registerIconLib(JSONEditor);
const elEditorContainer = document.querySelector(".editor-container");
const editor = new JSONEditor(elEditorContainer, {
  schema: jsoncvSchema,
  theme: "mytheme",
  iconlib: "myiconlib",
  disable_array_delete_all_rows: true,
  no_additional_properties: true,
  startval: data,
});
editor.on("ready", () => {
  // add anchor to each schema element
  document.querySelectorAll("[data-schemapath]").forEach((el) => {
    const schemapath = el.getAttribute("data-schemapath");
    el.id = schemapath;
  });
});

function getEditorData() {
  const data = editor.getValue();
  return {
    data,
    json: JSON.stringify(data, null, 2),
  };
}

const $outputJSON = $(".output-json");
const $outputHTML = $(".output-html");
const outputHTMLIframe = $outputHTML.get(0);

// listen to change
editor.on("change", () => {
  console.log("on editor change");
  const { json } = getEditorData();
  $outputJSON.text(json);

  // save to localstorage
  saveCVJSON(json);
});

// actions
const $btnTogglePreview = $("#fn-toggle-preview");
const $btnNewData = $("#fn-new-data");
const $btnUploadData = $("#fn-upload-data");
const $inputUploadData = $("input[name=upload-data]");
const $btnDownloadJSON = $("#fn-download-json");
const $btnDownloadHTML = $("#fn-download-html");
const $btnLoadSample = $("#fn-load-sample");
const $btnPrintPreview = $("#fn-print-preview");
const $inputColorPicker = $("#fn-color-picker");
const $colorValue = $(".color-picker .value");
const $loadThemes = $("#fn-load-themes");
const $themeName = $("#fn-theme-name");
console.log($themeName);
$loadThemes.on("click", () => {
  const $selectTheme = document.querySelector("#fn-change-theme");
  const themes = {
    "elegant": "jsonresume-theme-elegant",
    "caffeine": "jsonresume-theme-caffeine",
    "onepage": "jsonresume-theme-onepage",
    "kendall": "jsonresume-theme-kendall",
    "classic": "jsonresume-theme-classic",
    "spartan": "jsonresume-theme-spartan",
    "stackoverflow": "jsonresume-theme-stackoverflow",
    "material": "jsonresume-theme-material",
    "modern": "jsonresume-theme-modern",
    "paper": "jsonresume-theme-paper",
    "flat": "jsonresume-theme-flat-dark",
    "slick": "jsonresume-theme-slick",
    "sublime": "jsonresume-theme-sublime",
    "strath": "jsonresume-theme-strath",
    "compact": "jsonresume-theme-compact-light",
    "creative": "jsonresume-theme-creative",
    "macchiato": "jsonresume-theme-macchiato",
    "mocha": "jsonresume-theme-mocha",
    "resume": "jsonresume-theme-resume-cli",
    "cv": "jsonresume-theme-cv-boss",
    "even": "jsonresume-theme-even",
    "mudslide": "jsonresume-theme-mudslide",
    "turing": "jsonresume-theme-turing",
    "turquoise": "jsonresume-theme-turquoise",
    "dark": "jsonresume-theme-dark-classic",
    "papirus": "jsonresume-theme-papirus",
    "github": "jsonresume-theme-github",
    "wonderful": "jsonresume-theme-wonderful",
    "nudark": "jsonresume-theme-nudark",
    "shaheen": "jsonresume-theme-shaheen",
    "modernone": "jsonresume-theme-modernone",
    "fresh": "jsonresume-theme-fresh",
    "cool": "jsonresume-theme-cool",
    "writer": "jsonresume-theme-writer",
    "weston": "jsonresume-theme-weston",
    "jane": "jsonresume-theme-jane",
    "compactish": "jsonresume-theme-compactish",
    "francis": "jsonresume-theme-francis",
    "chalkboard": "jsonresume-theme-chalkboard",
    "glide": "jsonresume-theme-glide",
    "vitelotte": "jsonresume-theme-vitelotte",
    "proc": "jsonresume-theme-proc",
    "vanguard": "jsonresume-theme-vanguard",
    "zurich": "jsonresume-theme-zurich",
    "nord": "jsonresume-theme-nord",
    "rsm": "jsonresume-theme-rsm",
    "blaze": "jsonresume-theme-blaze",
    "bootstrap": "jsonresume-theme-bootstrap",
    "bulletin": "jsonresume-theme-bulletin",
    "cheerio": "jsonresume-theme-cheerio",
    "clear": "jsonresume-theme-clear",
    "daring": "jsonresume-theme-daring",
    "deutsche": "jsonresume-theme-deutsche",
    "dodger": "jsonresume-theme-dodger",
    "moski": "jsonresume-theme-moski",
    "nix": "jsonresume-theme-nix",
    "premium": "jsonresume-theme-premium",
    "prince": "jsonresume-theme-prince",
    "professional": "jsonresume-theme-professional",
    "pub": "jsonresume-theme-pub",
    "quickstart": "jsonresume-theme-quickstart",
    "railscasts": "jsonresume-theme-railscasts",
    "readonly": "jsonresume-theme-readonly",
    "refined": "jsonresume-theme-refined",
    "serene": "jsonresume-theme-serene",
    "simple": "jsonresume-theme-simple",
    "snazzy": "jsonresume-theme-snazzy",
    "sola": "jsonresume-theme-sola",
    "space": "jsonresume-theme-space",
    "themid": "jsonresume-theme-themid",
    "traditional": "jsonresume-theme-traditional",
    "ultrasimple": "jsonresume-theme-ultrasimple",
    "verde": "jsonresume-theme-verde",
    "xet": "jsonresume-theme-xet",
    "yax": "jsonresume-theme-yax",
    "zebra": "jsonresume-theme-zebra",
    "rubik": "jsonresume-theme-rubik",
    "ace": "jsonresume-theme-ace",
    "epic": "jsonresume-theme-epic",
    "kenzo": "jsonresume-theme-kenzo",
    "lucas": "jsonresume-theme-lucas",
    "dory": "jsonresume-theme-dory",
    "marine": "jsonresume-theme-marine",
    "legend": "jsonresume-theme-legend",
    "polaris": "jsonresume-theme-polaris",
    "merlin": "jsonresume-theme-merlin",
    "boost": "jsonresume-theme-boost",
    "mess": "jsonresume-theme-mess",
    "riverside": "jsonresume-theme-riverside",
    "dexter": "jsonresume-theme-dexter",
    "fancy": "jsonresume-theme-fancy",
    "paris": "jsonresume-theme-paris",
    "lush": "jsonresume-theme-lush",
    "owl": "jsonresume-theme-owl",
    "navigator": "jsonresume-theme-navigator",
    "skywalker": "jsonresume-theme-skywalker",
    "voyage": "jsonresume-theme-voyage",
    "knight": "jsonresume-theme-knight",
    "orchid": "jsonresume-theme-orchid",
    "panda": "jsonresume-theme-panda"
}
  for (let key of Object.keys(themes)) {
    console.log(key);
    const option = document.createElement("option", {});
    option.setAttribute("id", key);
    option.setAttribute("label", key);
    option.setAttribute("value", key);
    $selectTheme.add(option);
  }
  $selectTheme.addEventListener("change", (e) => {
    console.log(e.target.value);
    saveTheme(e.target.value);
  });
});

$themeName.on("input", (e) => {
  console.log(e.target.value);
  saveTheme(e.target.value);
});

//list the themes

const isElementHidden = (elt) =>
  !(elt.offsetWidth || elt.offsetHeight || elt.getClientRects().length);
$btnTogglePreview.on("click", () => {
  if (isElementHidden(outputHTMLIframe)) {
    $outputJSON.hide();
    $outputHTML.show();
  } else {
    $outputHTML.hide();
    $outputJSON.show();
  }
});

$btnNewData.on("click", () => {
  if (
    !confirm(
      "Are you sure to create an empty CV? Your current data will be lost."
    )
  )
    return;

  const v = propertiesToObject(jsoncvSchema.properties);
  console.log("new value", v);
  editor.setValue(v);
});

$btnUploadData.on("click", () => {
  if (
    !confirm(
      "Are you sure to upload an existing CV data? Your current data will be replaced."
    )
  )
    return;
  $inputUploadData.trigger("click");
});

$inputUploadData.on("change", () => {
  const files = $inputUploadData.get(0).files;
  if (files.length === 0) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (e) {
      const error = "Invalid JSON file: " + new String(e).toString();
      console.log(error);
      throw e;
    }
    editor.setValue(data);
  };

  reader.readAsText(files[0]);
});

function downloadCV(contentType) {
  const data = editor.getValue();
  const meta = data.meta || (data.meta = {});
  const title = getCVTitle(data);

  // update data
  meta.lastModified = dayjs().format("YYYY-MM-DDTHH:mm:ssZ[Z]");

  // download
  if (contentType === "json") {
    let filename = `${title}.json`;
    downloadContent(filename, JSON.stringify(data, null, 2));
  } else if (contentType === "html") {
    let filename = `${title}.html`;
    downloadIframeHTML(filename, outputHTMLIframe);
  }

  // update editor value
  editor.getEditor("root.meta").setValue(meta);
}

$btnDownloadJSON.on("click", () => {
  downloadCV("json");
});

$btnDownloadHTML.on("click", () => {
  downloadCV("html");
});

$btnLoadSample.on("click", () => {
  if (
    !confirm(
      "Are you sure to load sample data? Your current data will be replaced."
    )
  )
    return;

  editor.setValue(sampleModule.default);
});

$btnPrintPreview.on("click", () => {
  outputHTMLIframe.contentWindow.print();
});

// primary color

$inputColorPicker.on("change", (e) => {
  const color = e.target.value;
  console.log("color", color);
  $colorValue.text(color);
  savePrimaryColor(color);
});

const primaryColor = getPrimaryColor();
$colorValue.text(primaryColor);
$inputColorPicker.val(primaryColor);

const { execSync } = require("child_process");
const { readFileSync } = require("fs");

const exec = require("child_process").exec;
let themes = readFileSync(__dirname + "/theme-names.json", "utf-8");
const themesArr = JSON.parse(themes);
const existing = [];

themesArr.forEach((theme) => {
  execSync(`npm view ${theme}`, (error, stdout, stderr) => {
    console.log({
        stderr,
        stdout
    })
    if (error) {
      console.log(`${theme} does not exist on npm`);
    } else {
      console.log(`${theme} exists on npm`);
      existing.push(theme);
    }
  });
});
const final = {};
for (let e of existing) {
  const key = e.split("-");
  const name = key[2];
  if (!name) continue;
  final[name] = e;
}
console.log(final);

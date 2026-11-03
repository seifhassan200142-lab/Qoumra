// Re-generate the readable English HTML after editing content or templates.
// No package install is needed: node scripts/build.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({window:{},URL,Date});
for(const file of ['config','content','render'])vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),context);
const page=context.window.QoumraRender('en');
fs.writeFileSync(path.join(root,'index.html'),`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#800020">
  <meta name="description" content="Product photography, websites, paid advertising and AI automation. Help customers see your value, get answers and choose your business.">
  <title>Qoumra — Creative, Digital & AI Agency</title>
  <link rel="icon" href="assets/brand/qoumra-q.svg" type="image/svg+xml">
  <link rel="preload" href="assets/brand/qoumra-wordmark.svg" as="image">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/styles.css">
  <script src="js/config.js" defer></script>
  <script src="js/content.js" defer></script>
  <script src="js/render.js" defer></script>
  <script src="js/app.js" defer></script>
</head>
<body>
<div id="site-root">${page}</div>
<noscript><style>#inquiry-form,.language-switch,.menu-toggle{display:none}.desktop-nav{display:flex;flex-wrap:wrap}.site-header{height:auto;min-height:76px;flex-wrap:wrap;padding-block:16px}</style><p style="padding:24px;text-align:center">Enable JavaScript for language switching, the gallery and contact controls. / فعّل JavaScript لتغيير اللغة ومعرض الصور وأدوات التواصل.</p></noscript>
</body>
</html>\n`);
console.log('Built index.html; all paths are relative for GitHub Pages.');

const dist=path.join(root,"dist");
fs.mkdirSync(dist,{recursive:true});
for(const name of ["index.html","css","js","assets"])fs.cpSync(path.join(root,name),path.join(dist,name),{recursive:true});

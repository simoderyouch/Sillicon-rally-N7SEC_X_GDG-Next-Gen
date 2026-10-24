import markup from './assets/vendor/index.html?raw';
import stylesheet from './assets/vendor/build/app.css?raw';
import bridge from './bridge.js?raw';
import license from './assets/vendor/LICENSE?raw';

const scripts = import.meta.glob('./assets/vendor/app/scripts/**/*.js', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const assets = import.meta.glob('./assets/vendor/app/style/**/*.{svg,png,mp3}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const paths = Object.fromEntries(Object.entries(assets).map(([path, url]) => [path.replace('./assets/vendor/', ''), url]));
const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function frameDocument(instance: string) {
  const urls = Object.fromEntries(Object.entries(paths).map(([path, url]) => [path, new URL(url, location.href).href]));
  function resolve(path: string) {
    const key = path.replace(/^\.\.\//, '').replace(/\/+/g, '/');
    if (!urls[key]) throw new Error(`Missing Pac-Man asset: ${key}`);
    return urls[key];
  }
  const body = markup.replace(/src=['"]([^'"]+)['"]/g, (_, path) => `src="${resolve(path)}"`);
  const css = stylesheet.replace(/url\(["']?([^"')]+)["']?\)/g, (_, path) => `url("${resolve(path)}")`);
  const source = Object.entries(scripts).sort(([a], [b]) => a.localeCompare(b))
    .map(([, script]) => script.replace(/\/\/ removeIf\(production\)[\s\S]*?\/\/ endRemoveIf\(production\)/g, '')).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${css}\n*{font-family:monospace} .header-buttons{padding:4px;width:calc(100% - 8px)} .header-buttons .material-icons{font-size:14px;font-style:normal}.header-buttons button{padding:8px;background:#17243a;color:white;border:1px solid #475569;border-radius:4px} button{cursor:pointer} .logo{max-width:70%}</style></head><body>${body}
    <script>/* ${license} */
    const INSTANCE=${json(instance)}, ORIGIN=${json(location.origin)}, ASSETS=${json(urls)};
    function assetUrl(path){path=path.replace(/^["']|["']$/g,''); if(path.startsWith('http:')||path.startsWith('https:')||path.startsWith('data:'))return path; const key=path.replace(/\\/+/g,'/'); if(!ASSETS[key])throw new Error('Missing asset: '+key); return ASSETS[key];}
    function assetCss(value){return value.replace(/url\\(([^)]+)\\)?/,(_,path)=>'url("'+assetUrl(path)+'")');}
    ${source}\n${bridge.replace(/<\/script/gi, '<\\/script')}
    </script></body></html>`;
}

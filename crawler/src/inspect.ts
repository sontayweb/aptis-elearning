async function findDynamicImports() {
  const res = await fetch("https://aptiskytich.vn/assets/index-B6KZ3UtV.js");
  const text = await res.text();

  // Vite dynamic import helper usually has a mapping: e.g. "path/to/file.js" or ["assets/..."]
  const jsMatches = text.match(/["'][^"']*\.js["']/g) || [];
  console.log("All .js references in bundle:", Array.from(new Set(jsMatches)));

  // Look for route definitions: /reading, /nghe-chep, /listening
  const routeMatches = text.match(/path:\s*["'][^"']+["']/g) || [];
  console.log("Routes:", Array.from(new Set(routeMatches)));

  // Look for fetch or api calls
  const fetchMatches = text.match(/fetch\(["'][^"']+["']/g) || [];
  console.log("Fetches:", Array.from(new Set(fetchMatches)));
}
findDynamicImports();

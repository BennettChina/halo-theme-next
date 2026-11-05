import process from "node:process";

const baseUrl = (process.env.HALO_URL || "http://localhost:8090").replace(/\/+$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const maxLinks = Number(process.env.SMOKE_MAX_LINKS || 40);
const coreRoutes = ["/", "/archives", "/categories", "/tags"];
const extraRoutes = (process.env.SMOKE_ROUTES || "")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

const failures = [];

function absolute(url) {
  return new URL(url, `${baseUrl}/`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "halo-theme-next-smoke/1.0" },
  });
  return { response, text: await response.text() };
}

function checkHtml(route, response, text) {
  if (response.status !== 200) {
    failures.push(`${route}: HTTP ${response.status}`);
    return false;
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    failures.push(`${route}: 期望 HTML，实际为 ${contentType || "未知类型"}`);
    return false;
  }
  if (!/<title[^>]*>\s*[^<\s]/i.test(text)) {
    failures.push(`${route}: 缺少有效 <title>`);
  }
  if (/Whitelabel Error Page|Internal Server Error|TemplateProcessingException/i.test(text)) {
    failures.push(`${route}: 页面包含服务端错误内容`);
  }
  return true;
}

function extractInternalLinks(html) {
  const links = [];
  for (const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const href = match[1];
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) {
      continue;
    }
    const url = absolute(href);
    if (url.origin !== absolute("/").origin) {
      continue;
    }
    if (/\.(css|js|png|jpe?g|gif|svg|webp|ico|xml|json|pdf|zip)$/i.test(url.pathname)) {
      continue;
    }
    links.push(`${url.pathname}${url.search}`);
  }
  return links;
}

function extractThemeAssets(html) {
  const assets = new Set();
  const patterns = [/\bhref\s*=\s*["']([^"']+)["']/gi, /\bsrc\s*=\s*["']([^"']+)["']/gi];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const url = absolute(match[1]);
      if (
        url.origin === absolute("/").origin &&
        url.pathname.startsWith("/themes/theme-halo-next/")
      ) {
        assets.add(`${url.pathname}${url.search}`);
      }
    }
  }
  return [...assets];
}

async function main() {
  console.log(`Halo 实例: ${baseUrl}`);
  const visited = new Set();
  const queue = [...coreRoutes, ...extraRoutes];
  const assets = new Set();

  while (queue.length > 0 && visited.size < maxLinks) {
    const route = queue.shift();
    if (visited.has(route)) {
      continue;
    }
    visited.add(route);
    let result;
    try {
      result = await fetchText(absolute(route));
    } catch (error) {
      failures.push(`${route}: 请求失败 (${error.message})`);
      continue;
    }
    if (!checkHtml(route, result.response, result.text)) {
      continue;
    }
    console.log(`  OK ${route}`);
    for (const asset of extractThemeAssets(result.text)) {
      assets.add(asset);
    }
    if (route === "/" || route === "/archives") {
      for (const link of extractInternalLinks(result.text)) {
        if (!visited.has(link) && queue.length + visited.size < maxLinks) {
          queue.push(link);
        }
      }
    }
  }

  if (assets.size === 0) {
    failures.push("未发现任何 /themes/theme-halo-next/ 静态资源引用");
  }
  for (const asset of assets) {
    try {
      const response = await fetch(absolute(asset), {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status !== 200) {
        failures.push(`静态资源 ${String(asset)}: HTTP ${String(response.status)}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`静态资源 ${String(asset)}: 请求失败 (${String(message)})`);
    }
  }

  console.log(`\n检查页面: ${visited.size}，静态资源: ${assets.size}`);
  if (failures.length > 0) {
    console.error(`失败 ${failures.length} 项:`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log("Smoke 检查通过。");
}

main().catch((error) => {
  console.error(`Smoke 检查失败: ${error.message}`);
  process.exitCode = 1;
});

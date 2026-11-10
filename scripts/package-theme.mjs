import { spawn } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const projectRoot = process.cwd();
const developmentYamlFiles = new Set([
  "package-lock.yaml",
  "pnpm-lock.yaml",
  "pnpm-lock.yml",
  "pnpm-workspace.yaml",
  "pnpm-workspace.yml",
]);
const screenshotNames = new Set([
  "screenshot.png",
  "screenshot.jpeg",
  "screenshot.jpg",
  "screenshot.webp",
]);

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(command)} 退出码: ${code}`));
      }
    });
  });
}

async function copyRootRuntimeFiles(destination) {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const isRuntimeYaml = /\.ya?ml$/.test(entry.name) && !developmentYamlFiles.has(entry.name);
    const isRuntimeFile =
      isRuntimeYaml ||
      entry.name === "README.md" ||
      entry.name === "LICENSE" ||
      screenshotNames.has(entry.name);
    if (isRuntimeFile) {
      await copyFile(path.join(projectRoot, entry.name), path.join(destination, entry.name));
    }
  }
}

async function packageTheme() {
  const themeConfig = YAML.parse(await readFile(path.join(projectRoot, "theme.yaml"), "utf8"));
  const themeName = themeConfig?.metadata?.name;
  const themeVersion = themeConfig?.spec?.version;
  if (!themeName || !themeVersion) {
    throw new Error("theme.yaml 缺少 metadata.name 或 spec.version");
  }

  const stagingRoot = await mkdtemp(path.join(tmpdir(), "halo-theme-next-"));
  try {
    await copyRootRuntimeFiles(stagingRoot);
    await cp(path.join(projectRoot, "templates"), path.join(stagingRoot, "templates"), {
      recursive: true,
    });
    await cp(path.join(projectRoot, "i18n"), path.join(stagingRoot, "i18n"), {
      recursive: true,
    });

    const uiPluginDist = path.join(projectRoot, "ui-plugin", "dist");
    try {
      await cp(uiPluginDist, path.join(stagingRoot, "ui-plugin", "dist"), {
        recursive: true,
      });
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }

    const cliPath = fileURLToPath(import.meta.resolve("@halo-dev/theme-package-cli"));
    await run(process.execPath, [cliPath], { cwd: stagingRoot });

    const archiveName = `${themeName}-${themeVersion}.zip`;
    const outputDirectory = path.join(projectRoot, "dist");
    const outputPath = path.join(outputDirectory, archiveName);
    await mkdir(outputDirectory, { recursive: true });
    await copyFile(path.join(stagingRoot, "dist", archiveName), outputPath);
    console.log(`📦 已生成不含开发文件的主题包: ${outputPath}`);
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

packageTheme().catch((error) => {
  console.error(`打包失败: ${error.message}`);
  process.exitCode = 1;
});

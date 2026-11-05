import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import YAML from "yaml";

const DEFAULT_SETTINGS = path.resolve("settings.yaml");
const REMOVED_FIELDS = new Map([
  [
    "basic.favicon",
    "旧版遗留字段，模板从未读取；Halo 已通过系统设置自动注入 favicon，此字段会被忽略。",
  ],
  [
    "basic.menu.type",
    "主题已移除自定义菜单，菜单统一使用 Halo 菜单；此字段不再读取。",
  ],
  [
    "basic.menu.custom_menu",
    "主题已移除自定义菜单，菜单内容请在 Console 的“菜单”中维护；此字段不再读取。",
  ],
  [
    "sidebar.social.icons_only",
    "已迁移到 sidebar.social_icons.icons_only；请在新字段中设置。",
  ],
  [
    "post.follow_me.icons_only",
    "上游 Follow me 始终显示名称，此字段已移除，账号名称会正常显示。",
  ],
]);

function usage() {
  console.log(`用法:
  node scripts/check-config.mjs <config-export.json> [选项]

选项:
  --settings <path>     指定 settings.yaml，默认 ./settings.yaml
  --migrate <path>      输出补齐默认值后的配置 JSON
  --strict              存在警告时返回非零退出码`);
}

function parseArgs(argv) {
  const options = { input: "", settings: DEFAULT_SETTINGS, migrate: "", strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--settings") {
      options.settings = path.resolve(argv[++index] ?? "");
    } else if (arg === "--migrate") {
      options.migrate = path.resolve(argv[++index] ?? "");
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (!arg.startsWith("-") && !options.input) {
      options.input = path.resolve(arg);
    } else {
      throw new Error(`无法识别的参数: ${arg}`);
    }
  }
  if (!options.input) {
    usage();
    throw new Error("缺少配置导出文件路径");
  }
  return options;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function buildSchema(node, parent = {}) {
  const name = node.name;
  if (!name) {
    return null;
  }

  const field = {
    name,
    kind: node.$formkit,
    children: new Map(),
    defaultValue: clone(node.value),
    parent,
  };

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const childField = buildSchema(child, field);
      if (childField) {
        field.children.set(childField.name, childField);
      }
    }
  }

  if (field.kind === "group") {
    const defaults = isObject(field.defaultValue) ? clone(field.defaultValue) : {};
    for (const child of field.children.values()) {
      if (child.defaultValue !== undefined && defaults[child.name] === undefined) {
        defaults[child.name] = clone(child.defaultValue);
      }
    }
    field.defaultValue = defaults;
  }

  return field;
}

function walkConfig(schema, value, pathParts, report) {
  const actual = isObject(value) ? value : {};

  for (const key of Object.keys(actual)) {
    if (key === "slots") {
      continue;
    }
    if (!schema.children.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      const message =
        REMOVED_FIELDS.get(fieldPath) ??
        "当前 settings.yaml 未声明此字段，升级后会被保留但不会渲染。";
      report.warnings.push(`[未知字段] ${fieldPath}: ${message}`);
    }
  }

  for (const field of schema.children.values()) {
    const fieldPath = [...pathParts, field.name].join(".");
    const present = Object.prototype.hasOwnProperty.call(actual, field.name);
    if (!present) {
      if (field.defaultValue !== undefined) {
        report.info.push(
          `[缺失字段] ${fieldPath}: Halo 会使用默认值 ${JSON.stringify(field.defaultValue)}`,
        );
      } else {
        report.warnings.push(`[缺失字段] ${fieldPath}: 无默认值，模板需自行兜底。`);
      }
      continue;
    }

    const fieldValue = actual[field.name];
    if (field.kind === "array") {
      if (!Array.isArray(fieldValue)) {
        report.errors.push(`[类型错误] ${fieldPath}: 期望数组，实际为 ${typeof fieldValue}`);
        continue;
      }
      fieldValue.forEach((item, index) => {
        if (isObject(item) && field.children.size > 0) {
          walkConfig(field, item, [...pathParts, `${field.name}[${index}]`], report);
        }
      });
    } else if (field.children.size > 0) {
      if (!isObject(fieldValue)) {
        report.errors.push(`[类型错误] ${fieldPath}: 期望对象，实际为 ${typeof fieldValue}`);
        continue;
      }
      walkConfig(field, fieldValue, [...pathParts, field.name], report);
    } else if (field.defaultValue !== undefined) {
      const expected = Array.isArray(field.defaultValue) ? "array" : typeof field.defaultValue;
      const received = Array.isArray(fieldValue) ? "array" : typeof fieldValue;
      if (expected !== received) {
        report.warnings.push(
          `[类型不一致] ${fieldPath}: 默认值为 ${expected}，当前值为 ${received}。`,
        );
      }
    }
  }
}

function mergeDefaults(schemaValue, defaultValue) {
  if (!isObject(defaultValue)) {
    return schemaValue === undefined ? clone(defaultValue) : schemaValue;
  }
  const result = isObject(schemaValue) ? clone(schemaValue) : {};
  for (const [key, value] of Object.entries(defaultValue)) {
    if (result[key] === undefined) {
      result[key] = clone(value);
    } else if (isObject(value) && isObject(result[key])) {
      result[key] = mergeDefaults(result[key], value);
    }
  }
  return result;
}

function printList(title, items) {
  if (items.length === 0) {
    return;
  }
  console.log(`\n${title}:`);
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(options.input)) {
    throw new Error(`配置文件不存在: ${options.input}`);
  }
  if (!fs.existsSync(options.settings)) {
    throw new Error(`settings.yaml 不存在: ${options.settings}`);
  }

  const exported = JSON.parse(fs.readFileSync(options.input, "utf8"));
  const configs = exported.configs;
  if (!isObject(configs)) {
    throw new Error("配置导出文件中缺少 configs 对象");
  }

  const settings = YAML.parse(fs.readFileSync(options.settings, "utf8"));
  const forms = settings?.spec?.forms;
  if (!Array.isArray(forms)) {
    throw new Error("settings.yaml 中缺少 spec.forms");
  }

  const report = { errors: [], warnings: [], info: [] };
  const groups = new Map();
  for (const form of forms) {
    if (!form?.group) {
      continue;
    }
    const schema = { children: new Map() };
    for (const node of form.formSchema ?? []) {
      const field = buildSchema(node);
      if (field) {
        schema.children.set(field.name, field);
      }
    }
    groups.set(form.group, schema);
  }

  for (const group of Object.keys(configs)) {
    if (!groups.has(group)) {
      report.warnings.push(`[未知分组] ${group}: 当前 settings.yaml 未声明此分组。`);
    }
  }

  for (const [group, schema] of groups) {
    const value = configs[group];
    if (value === undefined) {
      report.errors.push(`[缺失分组] ${group}: 当前配置中没有此分组。`);
      continue;
    }
    if (!isObject(value)) {
      report.errors.push(`[类型错误] ${group}: 期望对象，实际为 ${typeof value}`);
      continue;
    }
    walkConfig(schema, value, [group], report);
  }

  console.log(`配置来源: ${options.input}`);
  console.log(`主题表单: ${options.settings}`);
  console.log(
    `检查结果: ${report.errors.length === 0 ? "可迁移" : "存在阻断问题"}` +
      `（${report.errors.length} 个错误，${report.warnings.length} 个警告）`,
  );

  printList("错误", report.errors);
  printList("警告", report.warnings);
  printList("提示", report.info);

  if (options.migrate) {
    const migrated = clone(exported);
    for (const [group, schema] of groups) {
      const defaults = {};
      for (const field of schema.children.values()) {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      }
      migrated.configs[group] = mergeDefaults(migrated.configs[group], defaults);
    }
    fs.mkdirSync(path.dirname(options.migrate), { recursive: true });
    fs.writeFileSync(options.migrate, `${JSON.stringify(migrated, null, 2)}\n`, "utf8");
    console.log(`\n迁移配置已写出: ${options.migrate}`);
  }

  if (report.errors.length > 0 || (options.strict && report.warnings.length > 0)) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(`配置检查失败: ${error.message}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
/**
 * 视觉资源交付检查脚本（S3-BRAND-005）
 *
 * 扫描 samples/assets/ 目录，按 docs/delivery-spec.md 的命名规范与体积上限，
 * 输出两类报告：① 超出体积上限的文件 ② 命名不合规的文件。
 *
 * 用法：
 *   node scripts/check_assets.js             # 输出操作日志，退出码 0
 *   node scripts/check_assets.js --strict    # 存在任一违规时退出码 1（供 CI 使用）
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'samples', 'assets');
const strict = process.argv.includes('--strict');

// 规范 §1：小写、连字符、模块前缀，可选 @2x/@3x 倍率后缀
const NAME_RE = /^[a-z][a-z0-9]*-[a-z0-9-]+(@[23]x)?\.(svg|jpg|png)$/;
// 规范 §4：单文件体积上限（字节）
const LIMITS = { icon: 4 * 1024, illust: 30 * 1024, banner: 120 * 1024, other: 120 * 1024 };

function kindOf(name) {
  const rest = name
    .replace(/^[a-z][a-z0-9]*-/, '')
    .replace(/@[23]x\.[a-z]+$/, '')
    .replace(/\.[a-z]+$/, '');
  if (rest === 'icon' || rest.startsWith('icon-')) return 'icon';
  if (rest.startsWith('illust-')) return 'illust';
  if (rest.startsWith('banner-')) return 'banner';
  return 'other';
}

const pad = (s, n) => String(s).padEnd(n);
const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile()).sort();

console.log('=== 视觉资源交付检查 · 操作日志 ===');
console.log(`扫描目录 : ${dir}`);
console.log(`命令     : node scripts/check_assets.js${strict ? ' --strict' : ''}`);
console.log(`命名规则 : ${NAME_RE}`);
console.log(`体积上限 : icon=${LIMITS.icon}B, illust=${LIMITS.illust}B, banner=${LIMITS.banner}B, other=${LIMITS.other}B`);
console.log(`文件总数 : ${files.length}`);
console.log('');
console.log('--- 逐文件判定 ---');

const overrun = [];
const badNames = [];
let clean = 0;

for (const name of files) {
  const size = fs.statSync(path.join(dir, name)).size;
  const kind = kindOf(name);
  const limit = LIMITS[kind];
  const nameOk = NAME_RE.test(name);
  const sizeOk = size <= limit;

  if (!nameOk) badNames.push({ name, size, kind });
  if (!sizeOk) overrun.push({ name, size, limit, kind });

  let flag = 'PASS';
  if (!nameOk && !sizeOk) flag = 'NAME+OVER';
  else if (!nameOk) flag = 'NAME';
  else if (!sizeOk) flag = 'OVER';
  else clean += 1;

  console.log(`[${pad(flag, 9)}] ${pad(name, 34)} size=${pad(size, 7)}B  limit=${pad(limit, 7)}B  kind=${kind}`);
}

console.log('');
console.log(`=== 报告 1：超出体积上限的文件 (${overrun.length}) ===`);
if (overrun.length === 0) console.log('  （无）');
overrun.forEach((x) => console.log(`  - ${x.name}  ${x.size}B > ${x.limit}B  (${x.kind})`));

console.log('');
console.log(`=== 报告 2：命名不合规的文件 (${badNames.length}) ===`);
if (badNames.length === 0) console.log('  （无）');
badNames.forEach((x) => console.log(`  - ${x.name}  不符合 ${NAME_RE}`));

console.log('');
console.log('=== 汇总 ===');
console.log(`合规 ${clean} / 超限 ${overrun.length} / 命名不合规 ${badNames.length} / 合计 ${files.length}`);
console.log('说明：样例目录特意包含违规文件，用于验证检查脚本能正确报告两类问题；');
console.log('      默认退出码 0，--strict 模式下存在违规时返回 1。');

const violations = overrun.length + badNames.length;
process.exit(strict && violations > 0 ? 1 : 0);

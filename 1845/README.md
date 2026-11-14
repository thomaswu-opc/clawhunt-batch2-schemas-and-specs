# #1845 · 小程序切图与视觉资源交付规范及检查脚本

ClawHunt 任务 `S3-BRAND-005` 的**已完成**交付物：七部分规范文档、12 项可勾选清单、
检查脚本与样例操作日志。本目录是 `clawhunt-batch2` 仓库的 `1845/` 子目录。

## 运行

无需安装依赖（仅 Node 标准库）：

```
node 1845/scripts/check_assets.js
node 1845/scripts/check_assets.js --strict   # CI 模式：存在违规时退出码 1
```

预期输出为「报告 1 / 报告 2 / 汇总」三段，默认退出码 0。
实际输出留存在 `1845/evidence/check-output.txt`。

## 文件

| 文件 | 内容 |
|---|---|
| `docs/delivery-spec.md` | 七部分规范：Naming / Table of Contents / Scale and Format / Volume / Subcontracting / Color Scheme / Chart Markup |
| `docs/checklist.md` | **恰好 12 项** Markdown 任务列表，每项可独立勾选并填写证据 |
| `scripts/check_assets.js` | 扫描样例目录，按命名正则与体积上限输出两类报告 |
| `samples/assets/` | 7 个虚构样例资源（4 合规、1 超限、2 命名不合规） |
| `evidence/check-output.txt` | 脚本实际操作日志 |

## 验收逐条对照

| 验收原文 | 对应证据 |
|---|---|
| `1. The specification document contains seven parts: naming, table of contents, scale and format, volume, subcontracting, color scheme, and chart markup` | `docs/delivery-spec.md` 的 7 个二级标题逐一对应，每部分含可执行规则与表格 |
| `2. The checklist has exactly 12 items and each can be ticked off one by one` | `docs/checklist.md` 为 12 行 `- [ ]` 任务列表（非表格内文本），GitHub 渲染为可勾选框，每行带依据与证据栏 |
| `3. The check script reports overrun and unnamed files in the sample directory (operation log)` | `evidence/check-output.txt`：报告 1 列出 `home-icon-oversize@2x.svg`（4456 B > 4096 B），报告 2 列出 `Icon_Home.png` 与 `standalone.png` 两个命名不合规文件；另附逐文件判定明细 |

检查脚本规则：命名 `^[a-z][a-z0-9]*-[a-z0-9-]+(@[23]x)?\.(svg|jpg|png)$`；
体积上限 `icon-` ≤ 4 KB、`illust-` ≤ 30 KB、`banner-` 及其他 ≤ 120 KB。
`--strict` 模式便于接入 CI，样例目录因故意包含违规文件，默认模式退出码为 0。

## 依赖与边界

- **需要**：Node 18+（仅 `fs` / `path` 标准库），无第三方依赖。
- **不需要**：Figma 源文件、设计稿、真实图片素材、微信开发者工具、真机、UI 截图、
  数据库、客户私有云、任何境外 SDK。证据链 100% 本地闭环。
- `samples/assets/` 中的 `.svg` / `.jpg` / `.png` 是**用于演示体积与命名判定的占位文件**，
  内容为虚构文本或最小 SVG，不代表真实视觉资源；超限文件由重复填充构造。
- 规范 §7 描述的是 Figma 图标标注方法本身，交付物为文字规范，源文件由设计侧另行提供。
- 跨工单依赖 S3-MINI 按任务约定以接口桩/mock 处理，本单不依赖其实现。

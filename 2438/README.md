# #2438 · 小红书笔记输出 Schema v1

ClawHunt 任务 `S5-OPS-019` 的**已完成**交付物：JSON Schema draft 2020-12、字段说明表、
10 份虚构样例与校验测试。本目录是 `clawhunt-batch2` 仓库的 `2438/` 子目录。

## 运行

在仓库根目录执行（依赖仅 `ajv@8`）：

```
npm install
node 2438/tests/validate.test.js
```

或 `npm test` 一次跑完本批三个交付包。预期输出为 `=== 汇总: ALL PASS ===`，退出码 0。
实际输出留存在 `2438/evidence/test-output.txt`。

## 文件

| 文件 | 内容 |
|---|---|
| `schemas/ops/xiaohongshu_note.v1.json` | 主 Schema，全部对象 `additionalProperties=false` |
| `schemas/registry.json` | S5-GW 注册表接口桩，`direct_publish=false` |
| `docs/fields.md` | 字段说明表、补充验证器说明、业务与安全约束 |
| `samples/valid.json` | 5 份合法虚构样例（其中 1 份含可选 `lint_issues`） |
| `samples/invalid.json` | 5 份非法样例，每条标注 `case` 与 `expect` |
| `tests/validate.test.js` | 逐条对照验收的断言与补充验证器 |
| `evidence/test-output.txt` | `node` 实际运行输出 |

## 验收逐条对照

| 验收原文 | 对应证据 |
|---|---|
| `1. Sample with a topic tag containing spaces and 11 tags failed validation (unit test)` | 第 3 节：含空格标签、11 个标签、两者同时出现、10 个标签上界、4 个标签下界，共 5 条断言；`invalid[1]` / `invalid[2]` 为对应反例 |
| `2. Sample with a shot value not among the 4 allowed values failed validation (unit test)` | 第 4 节：`shot=aerial` 被拒，4 种合法取值逐一通过；`invalid[4]` 为反例 |
| `3. All 5 valid samples passed, all 5 invalid samples failed (test output)` | 第 1、2 节逐条打印 PASS/FAIL 与 ajv 错误路径；输出留存于 `evidence/test-output.txt` |

附加抽查：`title_options` 恰好 3 项、`hook_type` 三值互异（补充验证器）、
`image_suggestions` / `body_points` 数量上下界、顶层多余字段、
`lead_emoji` 可空与长度、`closing_cta` 长度、可选 `lint_issues`、无金额字段。

## 依赖与边界

- **需要**：Node 18+、npm、`ajv@8`（使用 `ajv/dist/2020`）。
- **不需要**：数据库、Redis、FastAPI、Figma 源文件、微信开发者工具、真机、UI 截图、
  客户私有云访问权限、任何境外 SDK。证据链 100% 本地闭环。
- 跨工单依赖 S5-GW 按任务约定以接口桩处理，集成点记录在 `docs/fields.md`。
- 本目录不含任何真实个人、企业信息；未提交平台竞价之外不产生外部副作用。

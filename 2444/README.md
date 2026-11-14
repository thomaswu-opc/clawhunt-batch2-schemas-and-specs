# #2444 · 社群朋友圈文案输出 Schema v1

ClawHunt 任务 `S5-OPS-021` 的**已完成**交付物：JSON Schema draft 2020-12、字段说明表、
10 份虚构样例与校验测试。本目录是 `clawhunt-batch2` 仓库的 `2444/` 子目录。

## 运行

在仓库根目录执行（依赖仅 `ajv@8`）：

```
npm install
node 2444/tests/validate.test.js
```

预期输出为 `=== 汇总: ALL PASS ===`，退出码 0。实际输出留存在
`2444/evidence/test-output.txt`。

## 文件

| 文件 | 内容 |
|---|---|
| `schemas/ops/community_copy.v1.json` | 主 Schema，全部对象 `additionalProperties=false` |
| `schemas/registry.json` | S5-GW 注册表接口桩，`direct_publish=false`、`auto_send=false` |
| `docs/fields.md` | 字段说明表、仅供员工参考声明、补充验证器说明 |
| `samples/valid.json` | 5 份合法虚构样例（其中 1 份含可选 `lint_issues`） |
| `samples/invalid.json` | 5 份非法样例，每条标注 `case` 与 `expect` |
| `tests/validate.test.js` | 逐条对照验收的断言与补充验证器 |
| `evidence/test-output.txt` | `node` 实际运行输出 |

## 验收逐条对照

| 验收原文 | 对应证据 |
|---|---|
| `1. Sample validation fails when the long tier is missing (unit test)` | 第 3 节：分别移除 short / medium / long 三档并断言失败，三档齐全通过；`invalid[1]` 为缺 long 反例 |
| `2. Sample validation fails when day is duplicated in reminders (unit test, using uniqueItems or a custom check)` | 第 4 节：`reminderDaysDistinct` 自定义检查拒绝重复 day，4 个互异 day 通过；`invalid[2]` 为反例 |
| `3. Sample validation fails when suggested_time is 25:00 (unit test)` | 第 5 节：`25:00`、`24:00`、`09:60` 被拒，`00:00` / `23:59` 通过；`invalid[3]` 为反例 |
| `4. All 5 valid samples pass, all 5 invalid samples fail (test output)` | 第 1、2 节逐条打印 PASS/FAIL 与 ajv 错误路径；输出留存于 `evidence/test-output.txt` |

附加抽查：三档字数上界、`reminders` / `suggested_slots` 数量上下界、`channel` 枚举、
顶层多余字段、可选 `lint_issues`、无金额字段、字段说明中的「禁止自动发送」声明。

## 依赖与边界

- **需要**：Node 18+、npm、`ajv@8`（使用 `ajv/dist/2020`）。
- **不需要**：数据库、Redis、FastAPI、Figma 源文件、微信开发者工具、真机、UI 截图、
  客户私有云访问权限、任何境外 SDK。证据链 100% 本地闭环。
- 跨工单依赖 S5-GW 按任务约定以接口桩处理；`suggested_time` 与 `suggested_slots`
  仅供员工参考，不作为自动发送调度指令，详见 `docs/fields.md`。
- 本目录不含任何真实个人、企业信息。

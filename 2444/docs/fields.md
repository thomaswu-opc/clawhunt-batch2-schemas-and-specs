# community_copy.v1 字段说明表

Schema 文件：`schemas/ops/community_copy.v1.json`（JSON Schema draft 2020-12）。
所有对象均设置 `additionalProperties: false`；顶层 `variants` / `reminders` / `suggested_slots` 必填，
`lint_issues` 可选。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `variants` | object | `short` / `medium` / `long` **三档全部必填** | 同一文案的三种长度档 |
| `variants.short` | string | `maxLength=60` | 短档 |
| `variants.medium` | string | `maxLength=150` | 中档 |
| `variants.long` | string | `maxLength=300` | 长档 |
| `reminders` | array | 3–4 项 | 提醒节点 |
| `reminders[].day` | string | `T-3` / `T-1` / `T-0` / `T+1`，且不得重复 | 相对日期 |
| `reminders[].day` 不重复 | 补充验证器 | 同数组内两两不同 | **不在 Schema 内表达**，由 `tests/validate.test.js` 的 `reminderDaysDistinct` 强制 |
| `reminders[].suggested_time` | string | `^([01]\d\|2[0-3]):[0-5]\d$` | 24 小时制 HH:MM；`25:00`、`24:00` 均被拒 |
| `reminders[].text` | string | `maxLength=80` | 提醒文案 |
| `suggested_slots` | array | 1–4 项 | 建议发布时点 |
| `suggested_slots[].channel` | string | `Community` / `Moments` | 渠道 |
| `suggested_slots[].day` | string | 非空 | 相对日期或日期文本 |
| `suggested_slots[].time` | string | 非空 | 时点文本 |
| `lint_issues` | array（可选） | 每项 `code` / `message` 必填，`severity` ∈ info/warn/error | 人工复核提示 |

## 关键业务声明：仅供员工参考，不触发自动发送

**`suggested_time` 与 `suggested_slots` 仅供员工参考，任何模块不得用其触发自动发送。**
它们描述的是「建议」，不是调度指令。注册表接口桩 `schemas/registry.json` 同时固化
`direct_publish = false` 与 `auto_send = false`：通过 Schema 校验的内容只进入
`ai_review_queue`，由人工复核后再决定是否使用。

## 为什么 day 唯一性放在测试层

`uniqueItems` 对整个 item 对象去重，只要 `text` 或 `suggested_time` 不同，
两个 `day` 完全相同的提醒也会通过。任务范围允许「using uniqueItems or a custom check」，
因此本交付采用自定义检查 `reminderDaysDistinct`，并与 Schema 校验组合成
`validateFull = validate(schema) && reminderDaysDistinct(sample)`。
`invalid[2]`（day 重复）是专门覆盖这一层的反例。

## 其他约束

- **AI 不计算任何金额**：Schema 未定义金额/价格字段，`additionalProperties: false` 会拒绝
  模型自造金额字段；测试含「样例不含金额字段」断言。
- 校验通过的内容不得直接对外发布，见上。
- 所有样例为**虚构演示数据**：课程名、时段、楼层号、企业名称均为占位，
  不含真实个人、企业信息与客户名称。
- 运行依赖仅 Node 18+ 与 `ajv@8`（`ajv/dist/2020`），不引入任何向境外发送数据的 SDK。

## 集成点

`schemas/registry.json` 是 S5-GW（模型网关与 AI 复核队列）的本地接口桩，按任务
【Dependencies】约定使用；集成时合并进网关注册表配置。

# xiaohongshu_note.v1 字段说明表

Schema 文件：`schemas/ops/xiaohongshu_note.v1.json`（JSON Schema draft 2020-12）。
所有对象均设置 `additionalProperties: false`；顶层字段除 `lint_issues` 外全部必填。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `title_options` | array | 恰好 3 项（`minItems=3`、`maxItems=3`） | 标题候选 |
| `title_options[].text` | string | 1–20 字 | 标题文本 |
| `title_options[].hook_type` | string | `question` / `number` / `scene` | 切入方式 |
| `title_options[].hook_type` 互异 | 补充验证器 | 三个值必须两两不同 | **不在 Schema 内表达**，由 `tests/validate.test.js` 的 `hookTypesDistinct` 强制 |
| `body_points` | array | 3–6 项 | 正文分点 |
| `body_points[].lead_emoji` | string \| null | `maxLength=2`，可为 null | 引导符号 |
| `body_points[].text` | string | 1–200 字 | 分点正文 |
| `closing_cta` | string | `maxLength=60` | 结尾引导语 |
| `hashtags` | array | 5–10 项，每项匹配 `^#[^\s#]{1,15}$` | 话题标签；不允许空格与第二个 `#` |
| `image_suggestions` | array | 3–6 项 | 配图建议 |
| `image_suggestions[].scene` | string | `maxLength=60` | 画面场景 |
| `image_suggestions[].shot` | string | `wide` / `close-up` / `extreme close-up` / `detail` | 景别，仅这 4 种取值 |
| `image_suggestions[].note` | string | `maxLength=60` | 拍摄备注 |
| `lint_issues` | array（可选） | 每项 `code` / `message` 必填，`severity` ∈ info/warn/error | 供人工复核的提示，不参与业务判断 |

## 为什么 `hook_type` 互异放在测试层

`uniqueItems` 对整个 item 对象去重：只要 `text` 不同，即便三个 `hook_type` 完全相同也会通过。
任务范围明确要求「三个 hook_type 值必须互不相同 —— 由补充验证器强制」，
因此本交付在 `tests/validate.test.js` 中实现 `hookTypesDistinct`，并与 Schema 校验组合成
`validateFull = validate(schema) && hookTypesDistinct(sample)`。所有样例与验收断言均使用
`validateFull`。`invalid[5]`（hook_type 重复）是专门覆盖这一层的反例。

## 业务与安全约束（与任务范围一致）

- 校验通过的内容**只进入 AI 复核队列**（`registry.route_after_validation = ai_review_queue`），
  `direct_publish = false`，不得直接对外发布。
- **AI 不计算任何金额**：Schema 未定义金额/价格字段，`additionalProperties: false`
  会拒绝模型自造的金额字段；测试含「样例不含金额字段」断言。
- 所有样例为**虚构演示数据**，不含真实个人、企业信息与客户名称；图片建议中的
  二维码、桌牌、票面均注明使用占位内容。
- 运行依赖仅 Node 18+ 与 `ajv@8`（`ajv/dist/2020`），不引入任何向境外发送数据的 SDK。

## 集成点

`schemas/registry.json` 是 S5-GW（模型网关与 AI 复核队列）的本地接口桩，按任务
【Dependencies】约定使用。集成时把该文件内容合并进网关注册表配置，网关在模型输出后
加载本 Schema，通过校验的载荷写入 `ai_review_queue`。

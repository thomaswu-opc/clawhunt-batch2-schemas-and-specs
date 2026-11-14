# ClawHunt pilot batch 2 · 三个已完成的交付包

本仓库包含三个独立、可本地复现的交付包，均使用虚构数据、不依赖任何外部系统。

| 子目录 | 任务 | 交付物 | 测试 |
|---|---|---|---|
| `2438/` | S5-OPS-019 小红书笔记输出 Schema | draft 2020-12 Schema + 字段说明 + 10 样例 + 测试 | `node 2438/tests/validate.test.js` |
| `2444/` | S5-OPS-021 社群朋友圈文案输出 Schema | draft 2020-12 Schema + 字段说明 + 10 样例 + 测试 | `node 2444/tests/validate.test.js` |
| `1845/` | S3-BRAND-005 视觉资源交付规范与检查脚本 | 七部分规范 + 12 项清单 + 检查脚本 + 操作日志 | `node 1845/scripts/check_assets.js` |

## 一次跑完

```
npm install
npm test
```

`npm test` 依次执行三个子目录的测试；全部通过时三者均输出 `ALL PASS` 或正常汇总，退出码 0。
各包的原始输出已分别留存在 `*/evidence/` 目录。

## 共同约束

- 依赖仅 Node 18+ 与 `ajv@8`（`ajv/dist/2020`）；`1845` 甚至不需要第三方包。
- 不需要数据库、Figma 源文件、微信开发者工具、真机、UI 截图或客户私有云访问。
- 所有样例为虚构演示数据，不含真实个人、企业信息与客户名称。
- 跨工单依赖（S5-GW / S3-MINI）按任务约定以接口桩或 mock 处理，并在各包文档中记录集成点。
- 校验通过的内容只进入 AI 复核队列（`direct_publish=false`）；建议发布时间不作为自动发送指令。

各包详细运行方式与验收逐条对照见其自身 README。

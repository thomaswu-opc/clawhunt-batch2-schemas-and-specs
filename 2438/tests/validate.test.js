const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const root = path.resolve(__dirname, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const schema = read('schemas/ops/xiaohongshu_note.v1.json');
const registry = read('schemas/registry.json');
const valid = read('samples/valid.json');
const invalid = read('samples/invalid.json');

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  |  ' + detail : ''}`);
  if (!ok) failures += 1;
};
const errText = (v) => (v.errors || []).map((e) => `${e.instancePath || '/'} ${e.keyword}: ${e.message}`).join('; ');

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// 范围原文要求「三个 hook_type 值必须互不相同 —— 由补充验证器强制」。
// JSON Schema 的 uniqueItems 只对整个 item 对象去重，无法表达该跨元素语义，
// 因此这一条在测试层实现，并在 docs/fields.md 与 README 中明确声明。
const hookTypesDistinct = (sample) => {
  const types = (sample.title_options || []).map((t) => t.hook_type);
  return new Set(types).size === types.length;
};
const validateFull = (sample) => validate(sample) && hookTypesDistinct(sample);

console.log('=== 0. Schema 元信息与注册 ===');
check('方言为 draft 2020-12', schema.$schema === 'https://json-schema.org/draft/2020-12/schema');
check('ajv.validateSchema 通过元模式校验', ajv.validateSchema(schema), errText(ajv));
check('注册表登记 ops.xiaohongshu_note v1', registry.schemas.some((s) => s.key === 'ops.xiaohongshu_note' && s.version === 'v1'));
check('注册表声明 direct_publish=false', registry.schemas.every((s) => s.direct_publish === false));
check('注册表声明路由至 ai_review_queue', registry.schemas.every((s) => s.route_after_validation === 'ai_review_queue'));

console.log('');
console.log('=== 1. 验收 3：5 份合法样例全部通过 ===');
check('合法样例数量为 5', valid.length === 5, `实际 ${valid.length}`);
valid.forEach((sample, i) => {
  const ok = validateFull(sample);
  check(`valid[${i + 1}] 通过`, ok, ok ? '' : errText(validate));
});

console.log('');
console.log('=== 2. 验收 3：5 份非法样例全部被拒 ===');
check('非法样例数量为 5', invalid.length === 5, `实际 ${invalid.length}`);
invalid.forEach((item, i) => {
  const ok = validateFull(item.payload);
  const layer = validate(item.payload) ? '补充验证器' : 'Schema';
  check(`invalid[${i + 1}] 被拒绝 (${item.case})`, !ok, ok ? '意外通过' : `${layer}: ${errText(validate) || item.expect}`);
});

console.log('');
console.log('=== 3. 验收 1：含空格话题标签与 11 个标签均校验失败 ===');
const base = valid[0];
const spaced = { ...base, hashtags: ['#会员 活动', ...base.hashtags.slice(1)] };
check('标签含空格 → 校验失败', !validateFull(spaced), errText(validate));
const elevenTags = [...base.hashtags, '#额外一', '#额外二', '#额外三', '#额外四', '#额外五', '#额外六'];
check('11 个标签 → 校验失败', elevenTags.length === 11 && !validateFull({ ...base, hashtags: elevenTags }), errText(validate));
check('同时含空格且 11 个标签 → 校验失败', !validateFull({ ...base, hashtags: ['#会员 活动', ...elevenTags.slice(1)] }));
check('恰好 10 个合规标签 → 通过', validateFull({ ...base, hashtags: [...base.hashtags, '#额外一', '#额外二', '#额外三', '#额外四', '#额外五'] }));
check('仅 4 个标签 → 校验失败', !validateFull({ ...base, hashtags: base.hashtags.slice(0, 4) }));

console.log('');
console.log('=== 4. 验收 2：shot 不在 4 个允许值内校验失败 ===');
const badShot = { ...base, image_suggestions: [{ ...base.image_suggestions[0], shot: 'aerial' }, ...base.image_suggestions.slice(1)] };
check('shot=aerial → 校验失败', !validateFull(badShot), errText(validate));
['wide', 'close-up', 'extreme close-up', 'detail'].forEach((shot) => {
  check(`shot=${shot} → 通过`, validateFull({ ...base, image_suggestions: [{ ...base.image_suggestions[0], shot }, ...base.image_suggestions.slice(1)] }));
});

console.log('');
console.log('=== 5. 附加边界抽查 ===');
check('title_options 恰好 3 项（2 项失败）', !validateFull({ ...base, title_options: base.title_options.slice(0, 2) }));
check('title_options 4 项失败', !validateFull({ ...base, title_options: [...base.title_options, base.title_options[0]] }));
check('三个 hook_type 重复 → 补充验证器拒绝', !validateFull({
  ...base,
  title_options: [base.title_options[0], base.title_options[0], base.title_options[2]],
}));
check('image_suggestions 仅 2 项失败', !validateFull({ ...base, image_suggestions: base.image_suggestions.slice(0, 2) }));
check('body_points 仅 2 项失败', !validateFull({ ...base, body_points: base.body_points.slice(0, 2) }));
check('顶层多余字段被 additionalProperties 拒绝', !validateFull({ ...base, unexpected_field: 1 }), errText(validate));
check('lead_emoji=null 合法', validateFull({ ...base, body_points: base.body_points.map((p) => ({ ...p, lead_emoji: null })) }));
check('lead_emoji 超过 2 字符失败', !validateFull({
  ...base,
  body_points: [{ ...base.body_points[0], lead_emoji: 'ABC' }, ...base.body_points.slice(1)],
}));
check('closing_cta 超过 60 字符失败', !validateFull({ ...base, closing_cta: 'x'.repeat(61) }));
check('可选 lint_issues 结构合法', validateFull({ ...base, lint_issues: [{ code: 'TONE', message: '供人工复核' }] }));
check('样例不含金额字段', valid.every((s) => !('amount' in s) && !('price' in s) && !('fee' in s)));

console.log('');
console.log(`=== 汇总: ${failures === 0 ? 'ALL PASS' : failures + ' FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);

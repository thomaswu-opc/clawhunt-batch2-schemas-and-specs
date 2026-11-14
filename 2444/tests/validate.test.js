const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const root = path.resolve(__dirname, '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const schema = read('schemas/ops/community_copy.v1.json');
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

// 范围原文允许「using uniqueItems or a custom check」。uniqueItems 对整个 item
// 对象去重，text/time 不同即可绕过相同的 day，因此这里用自定义检查实现 day 唯一。
const reminderDaysDistinct = (sample) => {
  const days = (sample.reminders || []).map((r) => r.day);
  return new Set(days).size === days.length;
};
const validateFull = (sample) => validate(sample) && reminderDaysDistinct(sample);

console.log('=== 0. Schema 元信息与注册 ===');
check('方言为 draft 2020-12', schema.$schema === 'https://json-schema.org/draft/2020-12/schema');
check('ajv.validateSchema 通过元模式校验', ajv.validateSchema(schema), errText(ajv));
check('注册表登记 ops.community_copy v1', registry.schemas.some((s) => s.key === 'ops.community_copy' && s.version === 'v1'));
check('注册表声明 direct_publish=false', registry.schemas.every((s) => s.direct_publish === false));
check('注册表声明 auto_send=false', registry.schemas.every((s) => s.auto_send === false));
check('字段说明明确禁止自动发送', /不得.*自动发送|不得用其触发自动发送/.test(readText('docs/fields.md')));

console.log('');
console.log('=== 1. 验收 4：5 份合法样例全部通过 ===');
check('合法样例数量为 5', valid.length === 5, `实际 ${valid.length}`);
valid.forEach((sample, i) => {
  const ok = validateFull(sample);
  check(`valid[${i + 1}] 通过`, ok, ok ? '' : errText(validate));
});

console.log('');
console.log('=== 2. 验收 4：5 份非法样例全部被拒 ===');
check('非法样例数量为 5', invalid.length === 5, `实际 ${invalid.length}`);
invalid.forEach((item, i) => {
  const ok = validateFull(item.payload);
  const layer = validate(item.payload) ? '补充验证器' : 'Schema';
  check(`invalid[${i + 1}] 被拒绝 (${item.case})`, !ok, ok ? '意外通过' : `${layer}: ${errText(validate) || item.expect}`);
});

console.log('');
console.log('=== 3. 验收 1：缺少 long 档校验失败 ===');
const base = valid[0];
['short', 'medium', 'long'].forEach((tier) => {
  const v = { ...base.variants };
  delete v[tier];
  check(`缺少 ${tier} → 校验失败`, !validateFull({ ...base, variants: v }), errText(validate));
});
check('三档齐全 → 通过', validateFull(base));

console.log('');
console.log('=== 4. 验收 2：reminders 中 day 重复校验失败 ===');
const dupDay = { ...base, reminders: [base.reminders[0], base.reminders[1], { ...base.reminders[2], day: 'T-1' }] };
check('day 重复 → 补充验证器拒绝', !validateFull(dupDay));
check('4 个互不相同的 day → 通过', validateFull({
  ...base,
  reminders: [
    { day: 'T-3', suggested_time: '09:30', text: '预告' },
    { day: 'T-1', suggested_time: '18:00', text: '提醒' },
    { day: 'T-0', suggested_time: '08:45', text: '当日' },
    { day: 'T+1', suggested_time: '11:00', text: '回访' },
  ],
}));
check('day 不在 4 个允许值 → 校验失败', !validateFull({
  ...base,
  reminders: [{ ...base.reminders[0], day: 'T-7' }, base.reminders[1], base.reminders[2]],
}));

console.log('');
console.log('=== 5. 验收 3：suggested_time = 25:00 校验失败 ===');
const withTime = (t) => ({ ...base, reminders: [{ ...base.reminders[0], suggested_time: t }, ...base.reminders.slice(1)] });
check('25:00 → 校验失败', !validateFull(withTime('25:00')), errText(validate));
check('24:00 → 校验失败', !validateFull(withTime('24:00')));
check('09:5x 越界分钟 → 校验失败', !validateFull(withTime('09:60')));
check('00:00 → 通过', validateFull(withTime('00:00')));
check('23:59 → 通过', validateFull(withTime('23:59')));

console.log('');
console.log('=== 6. 附加边界抽查 ===');
check('short 超过 60 字失败', !validateFull({ ...base, variants: { ...base.variants, short: 'x'.repeat(61) } }));
check('medium 超过 150 字失败', !validateFull({ ...base, variants: { ...base.variants, medium: 'x'.repeat(151) } }));
check('long 超过 300 字失败', !validateFull({ ...base, variants: { ...base.variants, long: 'x'.repeat(301) } }));
check('reminders 仅 2 项失败', !validateFull({ ...base, reminders: base.reminders.slice(0, 2) }));
check('suggested_slots 为空失败', !validateFull({ ...base, suggested_slots: [] }));
check('suggested_slots 超过 4 项失败', !validateFull({
  ...base,
  suggested_slots: Array.from({ length: 5 }, () => ({ channel: 'Community', day: 'T-0', time: '09:00' })),
}));
check('channel 非法取值失败', !validateFull({
  ...base,
  suggested_slots: [{ channel: 'Email', day: 'T-0', time: '09:00' }],
}));
check('顶层多余字段被 additionalProperties 拒绝', !validateFull({ ...base, unexpected_field: 1 }), errText(validate));
check('可选 lint_issues 结构合法', validateFull({ ...base, lint_issues: [{ code: 'LENGTH_HINT', message: '供人工复核' }] }));
check('样例不含金额字段', valid.every((s) => !('amount' in s) && !('price' in s) && !('fee' in s)));

console.log('');
console.log(`=== 汇总: ${failures === 0 ? 'ALL PASS' : failures + ' FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);

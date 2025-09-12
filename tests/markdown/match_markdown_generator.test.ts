// match_markdown_generator.ts 的测试用例
import main from '../../script/markdown/match_markdown_generator';
import { meituanTestData, wechatTestData, cmbDebitCardTestData } from '../testData';

describe('match_markdown_generator.ts - 已匹配订单数据Markdown生成', () => {
  test('应该生成有效的Markdown', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '微信支付': wechatTestData[0]
      },
      {
        '美团': meituanTestData[1],
        '招商银行储蓄卡': cmbDebitCardTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
    expect(result.output).toContain('# 已匹配订单数据详情');
  });

  test('应该包含正确的标题', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '微信支付': wechatTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toContain('# 已匹配订单数据详情');
  });

  test('应该按数据来源分组', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '微信支付': wechatTestData[0]
      },
      {
        '美团': meituanTestData[1],
        '招商银行储蓄卡': cmbDebitCardTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toContain('## 微信支付');
    expect(result.output).toContain('## 招商银行储蓄卡');
  });

  test('应该包含美团和支付数据的列', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '微信支付': wechatTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toContain('美团-支付方式');
    expect(result.output).toContain('美团-交易成功时间');
    expect(result.output).toContain('美团-订单金额');
    expect(result.output).toContain('支付侧时间');
    expect(result.output).toContain('支付侧金额');
  });

  test('应该处理不同的换行类型', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '微信支付': wechatTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    // 检查是否使用了Unicode换行符
    expect(result.output).toContain('\u000A');
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: [] } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('错误：没有找到有效的匹配数据');
  });

  test('应该处理包含特殊字符的数据', async () => {
    const specialMeituan = {
      ...meituanTestData[0],
      订单标题: '包含特殊字符: ¥$%^&*()',
      备注: '备注\n包含换行符',
    };
    const specialPayment = {
      ...wechatTestData[0],
      商品: '商品名称\n包含换行符',
    };
    const input = [{
      '美团': specialMeituan,
      '微信支付': specialPayment
    }];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('包含特殊字符: ¥$%^&*()');
  });

  test('应该按美团订单时间降序排序', async () => {
    const input = [
      {
        '美团': { ...meituanTestData[0], 交易成功时间: '2025-01-01 10:00:00' },
        '微信支付': wechatTestData[0],
      },
      {
        '美团': { ...meituanTestData[0], 交易成功时间: '2025-01-02 10:00:00' },
        '微信支付': wechatTestData[0],
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    // 检查排序是否正确（较新的时间在前）
    const lines = result.output.split('\u000A');
    const dataLines = lines.filter(line => line.includes('2025-01-'));
    expect(dataLines[0]).toContain('2025-01-02');
    expect(dataLines[1]).toContain('2025-01-01');
  });

  test('应该处理null和undefined值', async () => {
    const input = [
      {
        '美团': { ...meituanTestData[0], 备注: null, 订单标题: undefined },
        '微信支付': { ...wechatTestData[0], 商品: null, 交易对方: undefined },
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('|  |'); // 空值应该显示为空字符串
  });

  test('应该处理无效的输入数据', async () => {
    const result = await main({ params: { input: 'invalid' as any } });

    expect(result.output).toContain('错误：输入数据必须是数组格式');
  });

  test('应该过滤掉无效的匹配数据', async () => {
    const input = [
      { '美团': meituanTestData[0], '微信支付': wechatTestData[0] }, // 有效数据
      { '美团': meituanTestData[0] }, // 无效：只有美团数据
      { '微信支付': wechatTestData[0] }, // 无效：只有支付数据
      null,
      undefined,
      'invalid',
      [],
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('# 已匹配订单数据详情');
    // 应该只包含有效数据
    expect(result.output).toContain('微信支付');
  });

  test('应该处理招商银行储蓄卡数据格式', async () => {
    const input = [
      {
        '美团': meituanTestData[0],
        '招商银行储蓄卡': cmbDebitCardTestData[0]
      },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('支付侧时间');
    expect(result.output).toContain('支付侧金额');
  });
});

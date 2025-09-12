// unmatch_markdown_generator.ts 的测试用例
import main from '../../script/markdown/unmatch_markdown_generator';
import { meituanTestData } from '../testData';

describe('unmatch_markdown_generator.ts - 无法匹配订单数据Markdown生成', () => {
  test('应该生成有效的Markdown', async () => {
    const input = meituanTestData;
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
    expect(result.output).toContain('# 无法匹配订单数据详情');
  });

  test('应该包含正确的标题', async () => {
    const input = meituanTestData;
    const result = await main({ params: { input } });

    expect(result.output).toContain('# 无法匹配订单数据详情');
  });

  test('应该按支付方式分组', async () => {
    const input = meituanTestData;
    const result = await main({ params: { input } });

    expect(result.output).toContain('## 招商银行储蓄卡()');
    expect(result.output).toContain('## 招商银行信用卡()');
  });

  test('应该包含表格数据', async () => {
    const input = meituanTestData;
    const result = await main({ params: { input } });

    expect(result.output).toContain('| 交易成功时间 |');
    expect(result.output).toContain('| 订单金额 |');
    expect(result.output).toContain('| 支付方式 |');
  });

  test('应该处理不同的换行类型', async () => {
    const input = meituanTestData;
    const result = await main({ params: { input } });

    // 检查是否使用了Unicode换行符
    expect(result.output).toContain('\u000A');
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: [] } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('错误：没有找到有效的美团订单数据');
  });

  test('应该处理包含特殊字符的数据', async () => {
    const specialData = [
      {
        ...meituanTestData[0],
        订单标题: '包含特殊字符: ¥$%^&*()',
        备注: '备注\n包含换行符',
      },
    ];
    const result = await main({ params: { input: specialData } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('包含特殊字符: ¥$%^&*()');
  });

  test('应该按交易成功时间降序排序', async () => {
    const input = [
      { ...meituanTestData[0], 交易成功时间: '2025-01-01 10:00:00' },
      { ...meituanTestData[0], 交易成功时间: '2025-01-02 10:00:00' },
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
    const inputWithNulls = [
      {
        ...meituanTestData[0],
        备注: null,
        订单标题: undefined,
      },
    ];
    const result = await main({ params: { input: inputWithNulls } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('|  |  |'); // 空值应该显示为空字符串
  });

  test('应该处理无效的输入数据', async () => {
    const result = await main({ params: { input: 'invalid' as any } });

    expect(result.output).toContain('错误：输入数据必须是数组格式');
  });

  test('应该过滤掉无效数据', async () => {
    const input = [
      ...meituanTestData,
      null,
      undefined,
      {},
      'invalid',
      [],
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('# 无法匹配订单数据详情');
    // 应该只包含有效数据
    expect(result.output).toContain('招商银行储蓄卡()');
  });

  test('应该处理单个订单数据', async () => {
    const input = [meituanTestData[0]];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('# 无法匹配订单数据详情');
    expect(result.output).toContain('## 招商银行储蓄卡()');
  });

  test('应该处理相同支付方式的多个订单', async () => {
    const input = [
      meituanTestData[0],
      { ...meituanTestData[0], 交易单号: 'different' },
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('## 招商银行储蓄卡()');
    // 应该包含两个订单
    const lines = result.output.split('\u000A');
    const dataLines = lines.filter(line => line.includes('420000') || line.includes('different'));
    expect(dataLines).toHaveLength(2);
  });
});

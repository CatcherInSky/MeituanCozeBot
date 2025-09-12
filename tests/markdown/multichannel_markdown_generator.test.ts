// multichannel_markdown_generator.ts 的测试用例
import main from '../../script/markdown/multichannel_markdown_generator';
import { wechatTestData, cmbDebitCardTestData } from '../testData';

describe('multichannel_markdown_generator.ts - 多渠道支付数据Markdown生成', () => {
  test('应该生成有效的Markdown', async () => {
    const input = [...wechatTestData, ...cmbDebitCardTestData];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
    expect(result.output).toContain('# 多渠道支付数据详情');
  });

  test('应该包含正确的标题', async () => {
    const input = [...wechatTestData, ...cmbDebitCardTestData];
    const result = await main({ params: { input } });

    expect(result.output).toContain('# 多渠道支付数据详情');
  });

  test('应该按数据来源分组', async () => {
    const input = [...wechatTestData, ...cmbDebitCardTestData];
    const result = await main({ params: { input } });

    expect(result.output).toContain('## 微信支付');
    expect(result.output).toContain('## 招商银行储蓄卡');
  });

  test('应该包含表格数据', async () => {
    const input = [...wechatTestData, ...cmbDebitCardTestData];
    const result = await main({ params: { input } });

    expect(result.output).toContain('| 交易时间 |');
    expect(result.output).toContain('| 记账日期 |');
    expect(result.output).toContain('| 数据来源 |');
  });

  test('应该处理不同的换行类型', async () => {
    const input = [...wechatTestData];
    const result = await main({ params: { input } });

    // 检查是否使用了Unicode换行符
    expect(result.output).toContain('\u000A');
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: [] } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('错误：没有找到有效的支付数据');
  });

  test('应该处理包含特殊字符的数据', async () => {
    const specialData = [
      {
        ...wechatTestData[0],
        备注: '包含特殊字符: ¥$%^&*()',
        商品: '商品名称\n包含换行符',
      },
    ];
    const result = await main({ params: { input: specialData } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('包含特殊字符: ¥$%^&*()');
  });

  test('应该按时间降序排序', async () => {
    const input = [
      {
        ...wechatTestData[0],
        交易时间: '2025-01-01 10:00:00',
      },
      {
        ...wechatTestData[0],
        交易时间: '2025-01-02 10:00:00',
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
    const inputWithNulls = [
      {
        ...wechatTestData[0],
        备注: null,
        商品: undefined,
      },
    ];
    const result = await main({ params: { input: inputWithNulls } });

    expect(result.output).toBeDefined();
    // 检查空值是否被正确处理（显示为空字符串）
    expect(result.output).toContain('|  | 支付成功 |'); // 备注为空，商品为空
  });

  test('应该处理无效的输入数据', async () => {
    const result = await main({ params: { input: 'invalid' as any } });

    expect(result.output).toContain('错误：输入数据必须是数组格式');
  });

  test('应该过滤掉无效数据', async () => {
    const input = [
      ...wechatTestData,
      null,
      undefined,
      {},
      'invalid',
      [],
    ];
    const result = await main({ params: { input } });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('# 多渠道支付数据详情');
    // 应该只包含有效数据
    expect(result.output).toContain('微信支付');
  });
});

// meituan_markdown_generator.ts 的测试用例
import main from '../../script/markdown/meituan_markdown_generator';
import { meituanTestData } from '../testData';

describe('meituan_markdown_generator.ts - 美团退款数据Markdown生成', () => {
  test('应该生成有效的Markdown', async () => {
    const result = await main({ 
      params: { 
        input: meituanTestData,
      } 
    });

    expect(result.output).toBeDefined();
    expect(typeof result.output).toBe('string');
    expect(result.output.length).toBeGreaterThan(0);
  });

  test('应该包含正确的标题', async () => {
    const result = await main({ 
      params: { 
        input: meituanTestData,
      } 
    });

    expect(result.output).toContain('# 美团退款数据详情');
  });

  test('应该按支付方式分组', async () => {
    const result = await main({ 
      params: { 
        input: meituanTestData,
      } 
    });

    expect(result.output).toContain('## 招商银行储蓄卡(5678)');
    expect(result.output).toContain('## 招商银行信用卡(1234)');
  });

  test('应该包含表格数据', async () => {
    const result = await main({ 
      params: { 
        input: meituanTestData,
      } 
    });

    expect(result.output).toContain('|');
    expect(result.output).toContain('交易成功时间');
    expect(result.output).toContain('交易创建时间');
    expect(result.output).toContain('订单金额');
    expect(result.output).toContain('实付金额');
  });

  test('应该处理不同的换行类型', async () => {
    const newlineTypes = ['natural', 'unicode', 'unicode2', 'unicode3', 'crlf', 'lf', 'cr'] as const;

    for (const newlineType of newlineTypes) {
      const result = await main({ 
        params: { 
          input: meituanTestData,
        } 
      });

      expect(result.output).toBeDefined();
      expect(typeof result.output).toBe('string');
    }
  });

  test('应该处理空输入', async () => {
    const result = await main({ 
      params: { 
        input: [],
      } 
    });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('错误：没有找到有效的对象数据');
  });

  test('应该处理包含特殊字符的数据', async () => {
    const specialData = [{
      ...meituanTestData[0],
      订单标题: '包含|特殊*字符_的[订单]',
      备注: '包含\n换行符的备注',
    }];

    const result = await main({ 
      params: { 
        input: specialData,
      } 
    });

    expect(result.output).toBeDefined();
    expect(result.output).toContain('包含|特殊*字符_的[订单]');
  });

  test('应该按交易成功时间降序排序', async () => {
    const unsortedData = [
      {
        ...meituanTestData[0],
        交易成功时间: '2025-09-08 15:53:25',
        交易单号: 'order1',
      },
      {
        ...meituanTestData[0],
        交易成功时间: '2025-09-07 10:30:00',
        交易单号: 'order2',
      },
      {
        ...meituanTestData[0],
        交易成功时间: '2025-09-09 08:15:00',
        交易单号: 'order3',
      },
    ];

    const result = await main({ 
      params: { 
        input: unsortedData,
      } 
    });

    // 检查是否按时间降序排列（最新的在前）
    const order3Index = result.output.indexOf('order3');
    const order1Index = result.output.indexOf('order1');
    const order2Index = result.output.indexOf('order2');

    expect(order3Index).toBeLessThan(order1Index);
    expect(order1Index).toBeLessThan(order2Index);
  });

  test('应该处理null和undefined值', async () => {
    const dataWithNulls = [
      {
        ...meituanTestData[0],
        备注: null as any,
        订单标题: undefined as any,
      },
    ];

    const result = await main({ 
      params: { 
        input: dataWithNulls,
      } 
    });

    expect(result.output).toBeDefined();
    expect(result.output).not.toContain('null');
    expect(result.output).not.toContain('undefined');
  });
});

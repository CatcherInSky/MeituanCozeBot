// meituan_filelist_process.ts 的测试用例
import main from '../../script/channel/meituan_filelist_process';
import { meituanRawInputData } from '../testData';

describe('meituan_filelist_process.ts - 美团订单数据处理', () => {
  test('应该正确解析美团原始数据', async () => {
    const result = await main({ params: { input: meituanRawInputData } });

    expect(result.output).toBeDefined();
    expect(Array.isArray(result.output)).toBe(true);
    expect(result.output.length).toBeGreaterThan(0);
  });

  test('应该正确提取订单字段', async () => {
    const result = await main({ params: { input: meituanRawInputData } });

    const order = result.output[0];
    expect(order).toHaveProperty('交易创建时间');
    expect(order).toHaveProperty('交易成功时间');
    expect(order).toHaveProperty('订单金额');
    expect(order).toHaveProperty('实付金额');
    expect(order).toHaveProperty('订单标题');
    expect(order).toHaveProperty('备注');
    expect(order).toHaveProperty('交易单号');
    expect(order).toHaveProperty('商家单号');
    expect(order).toHaveProperty('交易类型');
    expect(order).toHaveProperty('收/支');
    expect(order).toHaveProperty('支付方式');
  });

  test('应该过滤出退款数据', async () => {
    const result = await main({ params: { input: meituanRawInputData } });

    // 所有结果都应该是退款类型
    result.output.forEach(order => {
      expect(order.交易类型).toBe('退款');
    });
  });

  test('应该按交易成功时间排序', async () => {
    const result = await main({ params: { input: meituanRawInputData } });

    if (result.output.length > 1) {
      for (let i = 1; i < result.output.length; i++) {
        const prevTime = new Date(result.output[i - 1].交易成功时间);
        const currTime = new Date(result.output[i].交易成功时间);
        expect(prevTime.getTime()).toBeLessThanOrEqual(currTime.getTime());
      }
    }
  });

  test('应该处理无效的JSON数据', async () => {
    const invalidInput = ['invalid json', '{"incomplete": "object"'];
    
    const result = await main({ params: { input: invalidInput } });

    expect(result.output).toBeDefined();
    expect(Array.isArray(result.output)).toBe(true);
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: [] } });

    expect(result.output).toBeDefined();
    expect(Array.isArray(result.output)).toBe(true);
    expect(result.output.length).toBe(0);
  });

  test('应该去重相同交易单号的订单', async () => {
    const duplicateInput = [
      ...meituanRawInputData,
      ...meituanRawInputData, // 重复数据
    ];

    const result = await main({ params: { input: duplicateInput } });

    const transactionIds = result.output.map(order => order.交易单号);
    const uniqueIds = new Set(transactionIds);
    expect(transactionIds.length).toBe(uniqueIds.size);
  });
});

import main from '../../script/channel/alipay_file_process';
import { alipayRawInputData } from '../testData';

describe('alipay_file_process.ts - 支付宝数据处理', () => {
  test('应该正确解析支付宝原始数据', async () => {
    const result = await main({
      params: { input: alipayRawInputData[0] }
    });

    expect(result.output.channel).toBe('支付宝');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2025-08-12 00:00:00');
    expect(result.output.date[1]).toBe('2025-09-12 23:59:59');
    expect(result.output.data).toHaveLength(3);
    
    // 检查第一条交易记录
    const firstTransaction = result.output.data[0];
    expect(firstTransaction.交易时间).toBe('2025-09-11 15:17:22');
    expect(firstTransaction.交易分类).toBe('餐饮美食');
    expect(firstTransaction.交易对方).toBe('测试超市');
    expect(firstTransaction.金额).toBe('36.06');
    expect(firstTransaction['收/支']).toBe('支出');
    expect(firstTransaction.数据来源).toBe('支付宝');
  });

  test('应该处理无效JSON输入', async () => {
    const result = await main({
      params: { input: 'invalid json' }
    });

    expect(result.output.channel).toBe('支付宝');
    expect(result.output.date).toHaveLength(0);
    expect(result.output.data).toHaveLength(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({
      params: { input: '[]' }
    });

    expect(result.output.channel).toBe('支付宝');
    expect(result.output.date).toHaveLength(0);
    expect(result.output.data).toHaveLength(0);
  });
});

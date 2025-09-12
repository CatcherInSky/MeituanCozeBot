// wechat_file_process.ts 的测试用例
import main from '../../script/channel/wechat_file_process';
import { wechatRawInputData } from '../testData';

describe('wechat_file_process.ts - 微信支付数据处理', () => {
  test('应该正确解析微信支付原始数据', async () => {
    const result = await main({ params: { input: wechatRawInputData } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('微信支付');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(Array.isArray(result.output.date)).toBe(true);
    expect(result.output.date).toHaveLength(2);
  });

  test('应该正确提取日期范围', async () => {
    const result = await main({ params: { input: wechatRawInputData } });

    expect(result.output.date[0]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(result.output.date[1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    
    const startDate = new Date(result.output.date[0]);
    const endDate = new Date(result.output.date[1]);
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  test('应该正确提取交易数据', async () => {
    const result = await main({ params: { input: wechatRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction).toHaveProperty('交易时间');
      expect(transaction).toHaveProperty('金额(元)');
      expect(transaction).toHaveProperty('支付方式');
      expect(transaction).toHaveProperty('商户单号');
      expect(transaction).toHaveProperty('备注');
      expect(transaction).toHaveProperty('当前状态');
      expect(transaction).toHaveProperty('交易类型');
      expect(transaction).toHaveProperty('交易对方');
      expect(transaction).toHaveProperty('商品');
      expect(transaction).toHaveProperty('收/支');
      expect(transaction).toHaveProperty('交易单号');
      expect(transaction).toHaveProperty('数据来源');
      expect(transaction.数据来源).toBe('微信支付');
    }
  });

  test('应该处理无效的JSON数据', async () => {
    const invalidInput = 'invalid json';
    
    const result = await main({ params: { input: invalidInput } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('微信支付');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(result.output.data.length).toBe(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: '' } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('微信支付');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(result.output.data.length).toBe(0);
  });

  test('应该正确解析金额格式', async () => {
    const result = await main({ params: { input: wechatRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction['金额(元)']).toMatch(/^¥\d+\.\d{2}$/);
    }
  });

  test('应该正确解析时间格式', async () => {
    const result = await main({ params: { input: wechatRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction.交易时间).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    }
  });
});

// cmb_debitcard_file_process.ts 的测试用例
import main from '../../script/channel/cmb_debitcard_file_process';
import { cmbDebitCardRawInputData } from '../testData';

describe('cmb_debitcard_file_process.ts - 招商银行储蓄卡数据处理', () => {
  test('应该正确解析招商银行储蓄卡原始数据', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('招商银行储蓄卡');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(Array.isArray(result.output.date)).toBe(true);
    expect(result.output.date).toHaveLength(2);
  });

  test('应该正确提取日期范围', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    expect(result.output.date[0]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(result.output.date[1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    
    const startDate = new Date(result.output.date[0]);
    const endDate = new Date(result.output.date[1]);
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  test('应该正确提取交易数据', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction).toHaveProperty('记账日期');
      expect(transaction).toHaveProperty('货币');
      expect(transaction).toHaveProperty('交易金额');
      expect(transaction).toHaveProperty('联机余额');
      expect(transaction).toHaveProperty('交易摘要');
      expect(transaction).toHaveProperty('对手信息');
      expect(transaction).toHaveProperty('数据来源');
      expect(transaction.数据来源).toBe('招商银行储蓄卡');
    }
  });

  test('应该处理无效的输入数据', async () => {
    const invalidInput = 'invalid pdf text';
    
    const result = await main({ params: { input: invalidInput } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('招商银行储蓄卡');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(result.output.data.length).toBe(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({ params: { input: '' } });

    expect(result.output).toBeDefined();
    expect(result.output.channel).toBe('招商银行储蓄卡');
    expect(Array.isArray(result.output.data)).toBe(true);
    expect(result.output.data.length).toBe(0);
  });

  test('应该正确解析金额格式', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction.交易金额).toMatch(/^-?\d+\.\d{2}$/);
      expect(transaction.联机余额).toMatch(/^\d+\.\d{2}$/);
    }
  });

  test('应该正确解析日期格式', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction.记账日期).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('应该正确解析货币代码', async () => {
    const result = await main({ params: { input: cmbDebitCardRawInputData } });

    if (result.output.data.length > 0) {
      const transaction = result.output.data[0];
      expect(transaction.货币).toMatch(/^[A-Z]{3}$/);
    }
  });

  test('应该处理跨行数据', async () => {
    const multiLineInput = `
2024-09-15CNY-50.00760.81快捷支付岭南通
123
2024-09-16CNY-100.00860.81转账
456
    `;

    const result = await main({ params: { input: multiLineInput } });

    expect(result.output.data.length).toBeGreaterThan(0);
    result.output.data.forEach((transaction: any) => {
      expect(transaction.对手信息).toBeDefined();
    });
  });
});

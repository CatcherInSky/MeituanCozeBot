import main from '../../script/channel/gf_creditcard_file_process';
import { gfCreditCardRawInputData } from '../testData';

describe('gf_creditcard_file_process.ts - 广发银行信用卡数据处理', () => {
  test('应该正确解析广发银行信用卡原始数据', async () => {
    const result = await main({
      params: { input: gfCreditCardRawInputData }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2024-01-28 00:00:00');
    expect(result.output.date[1]).toBe('2024-02-27 23:59:59');
    expect(result.output.data.length).toBeGreaterThan(0);
    
    // 检查交易记录格式
    const firstTransaction = result.output.data[0];
    expect(firstTransaction).toHaveProperty('交易日期');
    expect(firstTransaction).toHaveProperty('入账日期');
    expect(firstTransaction).toHaveProperty('交易摘要');
    expect(firstTransaction).toHaveProperty('交易金额');
    expect(firstTransaction).toHaveProperty('交易货币');
    expect(firstTransaction).toHaveProperty('入账金额');
    expect(firstTransaction).toHaveProperty('入账货币');
    expect(firstTransaction.数据来源).toBe('广发银行信用卡');
  });

  test('应该处理缺少边界标识的数据', async () => {
    const incompleteData = `
    信用卡账户信息
    账单周期2024/01/28 - 2024/02/27个人消费额度30,000.00
    `;

    const result = await main({
      params: { input: incompleteData }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.data).toHaveLength(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({
      params: { input: '' }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(0);
    expect(result.output.data).toHaveLength(0);
  });
});

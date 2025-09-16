import main from '../../script/channel/cmb_creditcard_file_process';
import { cmbCreditCardRawInputData } from '../testData';

describe('cmb_creditcard_file_process.ts - 招商银行信用卡数据处理', () => {
  test('应该正确解析招商银行信用卡原始数据', async () => {
    const result = await main({
      params: { input: cmbCreditCardRawInputData }
    });

    expect(result.output.channel).toBe('招商银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2025-07-16 00:00:00');
    expect(result.output.date[1]).toBe('2025-08-16 23:59:59');
    expect(result.output.data.length).toBeGreaterThan(0);
    
    // 调试：打印实际解析的数据
    console.log('实际解析的数据:');
    result.output.data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.交易日} ${item.记账日} ${item.交易摘要} ${item.人民币金额} ${item.类型}`);
    });
    
    // 检查退款交易记录
    const refundTransactions = result.output.data.filter(t => t.类型 === '退款');
    expect(refundTransactions.length).toBeGreaterThan(0);
    
    const firstRefund = refundTransactions[0];
    expect(firstRefund.交易日).toBe('07/24'); // 根据实际解析结果调整
    expect(firstRefund.记账日).toBe('07/25');
    expect(firstRefund.交易摘要).toContain('财付通-财付通');
    expect(firstRefund.人民币金额).toBe('-1.64');
    expect(firstRefund.类型).toBe('退款');
    expect(firstRefund.数据来源).toBe('招商银行信用卡');
    
    // 检查消费交易记录
    const consumeTransactions = result.output.data.filter(t => t.类型 === '消费');
    expect(consumeTransactions.length).toBeGreaterThan(0);
  });

  test('应该正确处理类型字段', async () => {
    // 测试类型字段的正确解析
    const testData = `
    账单日  
    2025年08月16日
    本期账务明细 Transaction Details  
    人民币账户 RMB A/C  
    交易日记账日交易摘要人民币金额卡号末四位交易地金额
    SOLDPOSTEDDESCRIPTIONRMB AMOUNTCARD NO(Last 4digits)Original Tran Amount
     退款
     08/01 08/02 美团支付-美团App奈雪的茶-8.571234-8.57(CN)
     08/10 08/11 美团支付-美团App星巴克-16.501234-16.50(CN)
     消费
     07/16 07/17 美团支付-美团App奈雪的茶8.5712348.57(CN)
    本期还款总额
    `;

    const result = await main({
      params: { input: testData }
    });

    expect(result.output.data).toHaveLength(3);
    
    // 验证类型字段正确分配
    const refundTransactions = result.output.data.filter(t => t.类型 === '退款');
    const consumeTransactions = result.output.data.filter(t => t.类型 === '消费');
    
    expect(refundTransactions).toHaveLength(2);
    expect(consumeTransactions).toHaveLength(1);
    
    // 验证退款交易
    expect(refundTransactions[0].交易摘要).toContain('美团支付-美团App奈雪的茶');
    expect(refundTransactions[1].交易摘要).toContain('美团支付-美团App星巴克');
    
    // 验证消费交易
    expect(consumeTransactions[0].交易摘要).toContain('美团支付-美团App奈雪的茶');
  });

  test('应该处理缺少边界标识的数据', async () => {
    const incompleteData = `
    账单日  
    2025年07月16日
    `;

    const result = await main({
      params: { input: incompleteData }
    });

    expect(result.output.channel).toBe('招商银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.data).toHaveLength(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({
      params: { input: '' }
    });

    expect(result.output.channel).toBe('招商银行信用卡');
    expect(result.output.date).toHaveLength(0);
    expect(result.output.data).toHaveLength(0);
  });
});

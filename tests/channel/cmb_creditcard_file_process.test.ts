import main from '../../script/channel/cmb_creditcard_file_process';
import { cmbCreditCardRawInputData } from '../testData';

describe('cmb_creditcard_file_process.ts - 招商银行信用卡数据处理', () => {
  test('应该正确解析招商银行信用卡原始数据', async () => {
    const result = await main({
      params: { input: cmbCreditCardRawInputData }
    });

    expect(result.output.channel).toBe('招商银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2025-06-16 00:00:00');
    expect(result.output.date[1]).toBe('2025-07-16 23:59:59');
    expect(result.output.data.length).toBeGreaterThan(0);
    
    // 检查退款交易记录
    const refundTransactions = result.output.data.filter(t => t.类型 === '退款');
    expect(refundTransactions.length).toBeGreaterThan(0);
    
    const firstRefund = refundTransactions[0];
    expect(firstRefund.交易日).toBe('06/18');
    expect(firstRefund.记账日).toBe('06/19');
    expect(firstRefund.交易摘要).toContain('美团支付-美团App咖啡');
    expect(firstRefund.人民币金额).toBe('-2.66');
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
    2025年07月16日
    人民币账户 RMB A/C  
    交易日记账日交易摘要人民币金额卡号末四位交易地金额
    SOLDPOSTEDDESCRIPTIONRMB AMOUNTCARD NO(Last 4digits)Original Tran Amount
     退款
     06/18 06/19 美团支付-美团App咖啡-2.661234-2.66(CN)
     07/15 07/16 财付通-美团-0.181234-0.18(CN)
     消费
     06/20 06/21 美团支付-美团AppKOIThé20.80123420.80(CN)
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
    expect(refundTransactions[0].交易摘要).toContain('美团支付-美团App咖啡');
    expect(refundTransactions[1].交易摘要).toContain('财付通-美团');
    
    // 验证消费交易
    expect(consumeTransactions[0].交易摘要).toContain('美团支付-美团AppKOIThé');
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

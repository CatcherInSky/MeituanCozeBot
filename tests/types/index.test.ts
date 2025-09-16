// script/final.ts 的测试用例
import {
  getPaymentAmount,
  getPaymentTime,
  getPaymentTransactionType,
  getPaymentDescription,
  isCreditCardChannel,
} from '../../script/final';
import { wechatTestData, cmbDebitCardTestData, alipayTestData } from '../testData';
import { PaymentData } from '../../types';

describe('script/final.ts - 字段映射和工具函数', () => {
  describe('字段映射函数', () => {
    test('getPaymentAmount 应该正确提取微信支付金额', () => {
      const wechatData = wechatTestData[0];
      const amount = getPaymentAmount(wechatData);
      expect(amount).toBe('¥70.56');
    });

    test('getPaymentAmount 应该正确提取招商银行储蓄卡金额', () => {
      const cmbData = cmbDebitCardTestData[0];
      const amount = getPaymentAmount(cmbData);
      expect(amount).toBe('-50.00');
    });

    test('getPaymentTime 应该正确提取微信支付时间', () => {
      const wechatData = wechatTestData[0];
      const time = getPaymentTime(wechatData);
      expect(time).toBe('2025-09-08 15:53:25');
    });

    test('getPaymentTime 应该正确提取招商银行储蓄卡时间', () => {
      const cmbData = cmbDebitCardTestData[0];
      const time = getPaymentTime(cmbData);
      expect(time).toBe('2024-09-15');
    });

    test('getPaymentTransactionType 应该正确提取交易类型', () => {
      const wechatData = wechatTestData[0];
      const transactionType = getPaymentTransactionType(wechatData);
      expect(transactionType).toBe('商户消费');
    });

    test('getPaymentDescription 应该正确提取描述', () => {
      const wechatData = wechatTestData[0];
      const description = getPaymentDescription(wechatData);
      expect(description).toBe('朴朴商品订单');
    });

    test('isCreditCardChannel 应该正确识别信用卡渠道', () => {
      const wechatData = wechatTestData[0];
      const cmbCreditData = {
        交易日: '06/18',
        记账日: '06/19',
        日期: '2025/06/18',
        交易摘要: '美团支付-美团App咖啡',
        人民币金额: '-2.66',
        卡号末四位: '1234',
        交易地金额: '-2.66(CN)',
        类型: '退款',
        数据来源: '招商银行信用卡',
      };
      
      expect(isCreditCardChannel(wechatData)).toBe(false);
      expect(isCreditCardChannel(cmbCreditData)).toBe(true);
    });

    test('应该处理无效数据', () => {
      const invalidData = { invalid: 'data' } as any;
      expect(getPaymentAmount(invalidData)).toBe('');
      expect(getPaymentTime(invalidData)).toBe('');
      expect(getPaymentTransactionType(invalidData)).toBe('');
      expect(getPaymentDescription(invalidData)).toBe('');
      expect(isCreditCardChannel(invalidData)).toBe(false);
    });
  });

});

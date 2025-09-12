// script/final.ts 的测试用例
import {
  isWechatPayment,
  isCmbDebitCardPayment,
  isCmbCreditCardPayment,
  isAlipayPayment,
  getPaymentAmount,
  getPaymentTime,
} from '../../script/final';
import { wechatTestData, cmbDebitCardTestData } from '../testData';

describe('script/final.ts - 类型守卫和工具函数', () => {
  describe('类型守卫函数', () => {
    test('isWechatPayment 应该正确识别微信支付数据', () => {
      const wechatData = wechatTestData[0];
      expect(isWechatPayment(wechatData)).toBe(true);
      expect(isCmbDebitCardPayment(wechatData)).toBe(false);
      expect(isCmbCreditCardPayment(wechatData)).toBe(false);
      expect(isAlipayPayment(wechatData)).toBe(false);
    });

    test('isCmbDebitCardPayment 应该正确识别招商银行储蓄卡数据', () => {
      const cmbData = cmbDebitCardTestData[0];
      expect(isCmbDebitCardPayment(cmbData)).toBe(true);
      expect(isWechatPayment(cmbData)).toBe(false);
      expect(isCmbCreditCardPayment(cmbData)).toBe(false);
      expect(isAlipayPayment(cmbData)).toBe(false);
    });

    test('isCmbCreditCardPayment 应该正确识别招商银行信用卡数据', () => {
      const cmbCreditData = {
        ...cmbDebitCardTestData[0],
        数据来源: '招商银行信用卡',
      };
      expect(isCmbCreditCardPayment(cmbCreditData)).toBe(true);
      expect(isWechatPayment(cmbCreditData)).toBe(false);
      expect(isCmbDebitCardPayment(cmbCreditData)).toBe(false);
      expect(isAlipayPayment(cmbCreditData)).toBe(false);
    });

    test('isAlipayPayment 应该正确识别支付宝数据', () => {
      const alipayData = {
        ...wechatTestData[0],
        数据来源: '支付宝',
      };
      expect(isAlipayPayment(alipayData)).toBe(true);
      expect(isWechatPayment(alipayData)).toBe(false);
      expect(isCmbDebitCardPayment(alipayData)).toBe(false);
      expect(isCmbCreditCardPayment(alipayData)).toBe(false);
    });

    test('应该处理无效数据', () => {
      const invalidData = { invalid: 'data' } as any;
      expect(isWechatPayment(invalidData)).toBe(false);
      expect(isCmbDebitCardPayment(invalidData)).toBe(false);
      expect(isCmbCreditCardPayment(invalidData)).toBe(false);
      expect(isAlipayPayment(invalidData)).toBe(false);
    });
  });

  describe('工具函数', () => {
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

    test('应该处理无效数据', () => {
      const invalidData = { invalid: 'data' } as any;
      expect(getPaymentAmount(invalidData)).toBe('');
      expect(getPaymentTime(invalidData)).toBe('');
    });
  });

  describe('类型安全测试', () => {
    test('类型守卫应该提供类型收窄', () => {
      const paymentData = wechatTestData[0];

      if (isWechatPayment(paymentData)) {
        // 在这个块中，TypeScript应该知道paymentData是WechatPayment类型
        expect(paymentData.交易时间).toBeDefined();
        expect(paymentData['金额(元)']).toBeDefined();
        // 这些字段不应该存在于WechatPayment中
        // expect(paymentData.记账日期).toBeDefined();
      }

      if (isCmbDebitCardPayment(paymentData)) {
        // 这个块不应该执行，因为paymentData是微信支付数据
        expect(true).toBe(false);
      }
    });
  });
});

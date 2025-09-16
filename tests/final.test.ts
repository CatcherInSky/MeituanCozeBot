// final.ts 的全面测试用例
import main from '../script/final';
import { 
  meituanTestData, 
  aggregatedChannelTestData,
  wechatTestData,
  cmbDebitCardTestData 
} from './testData';
import { MeituanOrder, PaymentData, AggregatedChannelData } from '../types';
import {
  getPaymentAmount,
  getPaymentTime,
  getPaymentTransactionType,
  getPaymentDescription,
  isCreditCardChannel,
  isOrderMatchPaymentData,
  findMatchingPaymentData,
  extractAmount,
  isAmountMatch,
  normalizeTimeString,
  isPaymentTimeWithinWindow,
  preprocessPaymentData,
  preprocessMeituanOrder,
  calculateMatchScore,
} from '../script/final';

describe('final.ts - 美团订单与支付渠道数据匹配处理', () => {
  describe('基础功能测试', () => {
    test('应该正确处理匹配的订单', async () => {
      const meituanOrders: MeituanOrder[] = [meituanTestData[0]]; // 使用第一个测试订单
      const input: AggregatedChannelData = aggregatedChannelTestData;

      const result = await main({ params: { input, meituan: meituanOrders } });

      expect(result.output).toBeDefined();
      expect(result.output.multichannel).toBeDefined();
      expect(result.output.match).toBeDefined();
      expect(result.output.unmatch).toBeDefined();
      expect(result.output.uncover).toBeDefined();
    });

    test('应该正确收集所有渠道数据到multichannel', async () => {
      const meituanOrders: MeituanOrder[] = [];
      const input: AggregatedChannelData = aggregatedChannelTestData;

      const result = await main({ params: { input, meituan: meituanOrders } });

      expect(result.output.multichannel.length).toBeGreaterThan(0);
      expect(result.output.multichannel).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 数据来源: '微信支付' }),
          expect.objectContaining({ 数据来源: '招商银行储蓄卡' })
        ])
      );
    });
  });

  describe('匹配逻辑测试', () => {
    test('应该匹配金额和时间都相符的订单', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥70.56',
        交易成功时间: '2025-09-08 15:53:25',
        支付方式: '微信支付',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [{
            ...wechatTestData[0],
            '金额(元)': '¥70.56',
            交易时间: '2025-09-08 15:53:25',
          }],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(1);
      expect(result.output.match[0]['美团']).toEqual(meituanOrder);
      expect(result.output.unmatch).toHaveLength(0);
      expect(result.output.uncover).toHaveLength(0);
    });

    test('应该将金额不匹配的订单放入unmatch', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥100.00', // 不同的金额
        交易成功时间: '2025-09-08 15:53:25',
        支付方式: '微信支付',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [{
            ...wechatTestData[0],
            '金额(元)': '¥70.56', // 不同的金额
            交易时间: '2025-09-08 15:53:25',
          }],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(0);
      expect(result.output.unmatch).toHaveLength(1);
      expect(result.output.unmatch[0]).toEqual(meituanOrder);
    });

    test('应该将时间不在范围内的订单放入uncover', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥70.56',
        交易成功时间: '2025-10-08 15:53:25', // 超出时间范围
        支付方式: '微信支付',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'], // 时间范围
          data: [{
            ...wechatTestData[0],
            '金额(元)': '¥70.56',
            交易时间: '2025-09-08 15:53:25',
          }],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(0);
      expect(result.output.unmatch).toHaveLength(0);
      expect(result.output.uncover).toHaveLength(1);
      expect(result.output.uncover[0]).toEqual(meituanOrder);
    });

    test('应该将支付方式不匹配的订单放入uncover', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        支付方式: '未知支付方式', // 不匹配的支付方式
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [wechatTestData[0]],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(0);
      expect(result.output.unmatch).toHaveLength(0);
      expect(result.output.uncover).toHaveLength(1);
      expect(result.output.uncover[0]).toEqual(meituanOrder);
    });
  });

  describe('渠道特定匹配规则测试', () => {
    test('应该正确匹配微信支付数据', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥70.56',
        交易成功时间: '2025-09-08 15:53:25',
        支付方式: '微信支付',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [{
            ...wechatTestData[0],
            '金额(元)': '¥70.56',
            交易时间: '2025-09-08 15:53:25',
          }],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(1);
    });

    test('应该正确匹配招商银行储蓄卡数据', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥50.00',
        交易成功时间: '2024-09-15 12:00:00',
        支付方式: '招商银行储蓄卡',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '招商银行储蓄卡',
          date: ['2024-09-06 00:00:00', '2025-09-06 23:59:59'],
          data: [{
            ...cmbDebitCardTestData[0],
            交易金额: '50.00',
            记账日期: '2024-09-15',
          }],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(1);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理空的输入数据', async () => {
      const result = await main({ 
        params: { 
          input: [] as AggregatedChannelData, 
          meituan: [] 
        } 
      });

      expect(result.output.multichannel).toHaveLength(0);
      expect(result.output.match).toHaveLength(0);
      expect(result.output.unmatch).toHaveLength(0);
      expect(result.output.uncover).toHaveLength(0);
    });

    test('应该处理null的渠道数据', async () => {
      const input: AggregatedChannelData = [{
        Group1: null,
        Group2: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [wechatTestData[0]],
        },
      }];

      const result = await main({ 
        params: { 
          input, 
          meituan: [meituanTestData[0]] 
        } 
      });

      expect(result.output.multichannel).toHaveLength(1);
    });

    test('应该处理多个匹配的情况（只取第一个）', async () => {
      const meituanOrder: MeituanOrder = {
        ...meituanTestData[0],
        实付金额: '¥70.56',
        交易成功时间: '2025-09-08 15:53:25',
        支付方式: '微信支付',
      };

      const input: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: [
            {
              ...wechatTestData[0],
              '金额(元)': '¥70.56',
              交易时间: '2025-09-08 15:53:25',
            },
            {
              ...wechatTestData[0],
              '金额(元)': '¥70.56',
              交易时间: '2025-09-08 15:53:25',
              交易单号: '420001', // 不同的交易单号
            },
          ],
        },
      }];

      const result = await main({ params: { input, meituan: [meituanOrder] } });

      expect(result.output.match).toHaveLength(1);
      expect(result.output.match[0]['微信支付']).toEqual(
        expect.objectContaining({ 交易单号: 'WX001001001001001001001' })
      );
    });
  });

  describe('性能测试', () => {
    test('应该能处理大量数据', async () => {
      const largeMeituanOrders: MeituanOrder[] = Array.from({ length: 1000 }, (_, i) => ({
        ...meituanTestData[0],
        交易单号: `order_${i}`,
        实付金额: `¥${(i + 1) * 10}.00`,
      }));

      const largeInput: AggregatedChannelData = [{
        Group1: {
          channel: '微信支付',
          date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
          data: Array.from({ length: 1000 }, (_, i) => ({
            ...wechatTestData[0],
            交易单号: `payment_${i}`,
            '金额(元)': `¥${(i + 1) * 10}.00`,
          })),
        },
      }];

      const startTime = Date.now();
      const result = await main({ 
        params: { 
          input: largeInput, 
          meituan: largeMeituanOrders 
        } 
      });
      const endTime = Date.now();

      expect(result.output).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });
  });

  describe('重构后的统一匹配逻辑测试', () => {
    describe('字段映射功能测试', () => {
      test('应该正确获取微信支付的金额字段', () => {
        const wechatData: PaymentData = {
          ...wechatTestData[0],
          '金额(元)': '¥70.56',
          数据来源: '微信支付',
        };
        
        expect(getPaymentAmount(wechatData)).toBe('¥70.56');
        expect(getPaymentTime(wechatData)).toBe('2025-09-08 15:53:25');
        expect(getPaymentTransactionType(wechatData)).toBe('支出'); // 现在使用收/支字段
        expect(isCreditCardChannel(wechatData)).toBe(false);
      });

      test('应该正确获取招商银行信用卡的字段', () => {
        const cmbCreditData: PaymentData = {
          卡号末四位: '5625',
          记账日: '08/16',
          交易摘要: '美团支付-美团App奈雪的茶',
          交易日: '09/15',
          类型: '退款',
          交易地金额: '-8.57(CN)',
          人民币金额: '-8.57',
          数据来源: '招商银行信用卡',
          日期: '2025/08/16',
        };
        
        expect(getPaymentAmount(cmbCreditData)).toBe('-8.57');
        expect(getPaymentTime(cmbCreditData)).toBe('08/16');
        expect(getPaymentTransactionType(cmbCreditData)).toBe('退款');
        expect(getPaymentDescription(cmbCreditData)).toBe('美团支付-美团App奈雪的茶');
        expect(isCreditCardChannel(cmbCreditData)).toBe(true);
      });
    });

    describe('金额处理功能测试', () => {
      test('应该正确提取金额数值', () => {
        expect(extractAmount('¥70.56')).toBe(70.56);
        expect(extractAmount('$100.00')).toBe(100);
        expect(extractAmount('1,234.56')).toBe(1234.56);
        expect(extractAmount('-8.57')).toBe(-8.57);
        expect(extractAmount('')).toBe(0);
      });

      test('应该正确比较金额', () => {
        expect(isAmountMatch('¥70.56', '70.56')).toBe(true);
        expect(isAmountMatch('¥70.56', '70.55')).toBe(true); // 允许0.01误差
        expect(isAmountMatch('¥70.56', '70.50')).toBe(false);
        expect(isAmountMatch('-8.57', '-8.57')).toBe(true);
        // 测试实际误差值（考虑浮点数精度问题）
        expect(Math.abs(70.56 - 70.55)).toBeLessThanOrEqual(0.011);
      });
    });

    describe('时间处理功能测试', () => {
      test('应该正确标准化时间格式', () => {
        expect(normalizeTimeString('08/10')).toBe('2025-08-10 23:59:59');
        expect(normalizeTimeString('2025-08-10')).toBe('2025-08-10 23:59:59');
        expect(normalizeTimeString('2024/02/25')).toBe('2024-02-25 23:59:59');
        expect(normalizeTimeString('2025-09-08 15:53:25')).toBe('2025-09-08 15:53:25');
      });

      test('应该正确检查时间窗口', () => {
        const meituanTime = '2025-09-08 15:53:25';
        const paymentTime1 = '2025-09-08 16:53:25'; // 1小时后
        const paymentTime2 = '2025-09-09 15:53:25'; // 24小时后
        const paymentTime3 = '2025-09-10 15:53:25'; // 48小时后
        
        expect(isPaymentTimeWithinWindow(paymentTime1, meituanTime, 24)).toBe(true);
        expect(isPaymentTimeWithinWindow(paymentTime2, meituanTime, 24)).toBe(true);
        expect(isPaymentTimeWithinWindow(paymentTime3, meituanTime, 24)).toBe(false);
        expect(isPaymentTimeWithinWindow(paymentTime3, meituanTime, 48)).toBe(true);
      });
    });


    describe('统一匹配规则测试', () => {
      test('应该优先使用强规则匹配', () => {
        const meituanOrder: MeituanOrder = {
          ...meituanTestData[0],
          交易类型: '退款',
          实付金额: '¥70.56',
          交易成功时间: '2025-09-08 15:53:25',
        };

        const paymentData: PaymentData = {
          ...wechatTestData[0],
          交易类型: '退款',
          '金额(元)': '¥70.56',
          交易时间: '2025-09-08 16:53:25',
          交易摘要: '美团支付-美团App',
          数据来源: '微信支付',
        };

        expect(isOrderMatchPaymentData(meituanOrder, paymentData)).toBe(true);
      });

      test('应该使用弱规则匹配当强规则不匹配时', () => {
        const meituanOrder: MeituanOrder = {
          ...meituanTestData[0],
          交易类型: '消费', // 非退款，强规则不匹配
          实付金额: '¥70.56',
          交易成功时间: '2025-09-08 15:53:25',
        };

        const paymentData: PaymentData = {
          ...wechatTestData[0],
          交易类型: '收入',
          '金额(元)': '¥70.56',
          交易时间: '2025-09-08 16:53:25',
          交易摘要: '美团支付-美团App', // 包含美团，弱规则匹配
          数据来源: '微信支付',
        };

        expect(isOrderMatchPaymentData(meituanOrder, paymentData)).toBe(true);
      });
    });
  });
});

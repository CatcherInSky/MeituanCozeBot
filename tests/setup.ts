// Jest测试设置文件
import 'jest';

// 设置测试超时时间
jest.setTimeout(10000);

// 全局测试工具函数
global.testUtils = {
  // 创建测试用的美团订单数据
  createMeituanOrder: (overrides = {}) => ({
    交易创建时间: '2025-09-08 15:53:25',
    交易成功时间: '2025-09-08 15:53:25',
    订单金额: '¥70.56',
    实付金额: '¥70.56',
    订单标题: '朴朴商品订单',
    备注: '/',
    交易单号: '420000',
    商家单号: '040',
    交易类型: '商户消费',
    '收/支': '支出',
    支付方式: '招商银行储蓄卡()',
    ...overrides,
  }),

  // 创建测试用的微信支付数据
  createWechatPayment: (overrides = {}) => ({
    交易时间: '2025-09-08 15:53:25',
    '金额(元)': '¥70.56',
    支付方式: '招商银行储蓄卡()',
    商户单号: '040',
    备注: '/',
    当前状态: '支付成功',
    交易类型: '商户消费',
    交易对方: '朴朴超市',
    商品: '朴朴商品订单',
    '收/支': '支出',
    交易单号: '420000',
    数据来源: '微信支付',
    ...overrides,
  }),

  // 创建测试用的招商银行储蓄卡数据
  createCmbDebitCardPayment: (overrides = {}) => ({
    记账日期: '2024-09-15',
    货币: 'CNY',
    交易金额: '-50.00',
    联机余额: '760.81',
    交易摘要: '快捷支付岭南通',
    对手信息: '123',
    数据来源: '招商银行储蓄卡',
    ...overrides,
  }),

  // 创建测试用的聚合渠道数据
  createAggregatedChannelData: (overrides = {}) => ({
    Group1: {
      channel: '微信支付',
      date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
      data: [global.testUtils.createWechatPayment()],
    },
    Group2: {
      channel: '招商银行储蓄卡',
      date: ['2024-09-06 00:00:00', '2025-09-06 23:59:59'],
      data: [global.testUtils.createCmbDebitCardPayment()],
    },
    ...overrides,
  }),
};

// 扩展Jest的expect类型
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMeituanOrder(): R;
      toBeValidPaymentData(): R;
      toBeValidChannelData(): R;
    }
  }

  var testUtils: {
    createMeituanOrder: (overrides?: any) => any;
    createWechatPayment: (overrides?: any) => any;
    createCmbDebitCardPayment: (overrides?: any) => any;
    createAggregatedChannelData: (overrides?: any) => any;
  };
}

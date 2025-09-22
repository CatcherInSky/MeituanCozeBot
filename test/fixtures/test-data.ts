import { 
  MeituanOrder, 
  WechatPayment, 
  AlipayPayment, 
  CmbCreditCardPayment,
  CmbDebitCardPayment,
  MeituanBalance,
  GroupData,
  DataOutput,
  DateList,
  PaymentData
} from '../../types';

// 脱敏的美团订单测试数据
export const mockMeituanOrders: MeituanOrder[] = [
  {
    支付方式: "招商银行信用卡(1234)",
    实付金额: "¥16.00",
    备注: "/",
    订单标题: "测试商户A 订单详情",
    交易创建时间: "2025-06-02 15:08:21",
    交易成功时间: "2025-06-02 15:08:27",
    交易类型: "支付",
    '收/支': "支出",
    订单金额: "¥16.00",
    交易单号: "TEST001100040167000930062313661234",
    商家单号: "TEST_MERCHANT_001",
    channel: "招商银行信用卡(1234)",
    type: "支付",
    date: 1748848101, // 2025-06-02 15:08:21
    amount: 16.00,
    id: "TEST001100040167000930062313661234"
  },
  {
    支付方式: "微信支付",
    实付金额: "¥25.50",
    备注: "/",
    订单标题: "测试商户B 订单详情",
    交易创建时间: "2025-06-03 12:30:15",
    交易成功时间: "2025-06-03 12:30:18",
    交易类型: "退款",
    '收/支': "收入",
    订单金额: "¥25.50",
    交易单号: "TEST002100040167000925751707762",
    商家单号: "TEST_MERCHANT_002",
    channel: "微信支付",
    type: "退款",
    date: 1748925015, // 2025-06-03 12:30:15
    amount: 25.50,
    id: "TEST002100040167000925751707762"
  },
  {
    支付方式: "美团余额+招商银行信用卡(1234)",
    实付金额: "¥100.00",
    备注: "/",
    订单标题: "测试商户C 订单详情",
    交易创建时间: "2025-06-04 18:45:30",
    交易成功时间: "2025-06-04 18:45:35",
    交易类型: "支付",
    '收/支': "支出",
    订单金额: "¥100.00",
    交易单号: "TEST003100040167003503513000",
    商家单号: "TEST_MERCHANT_003",
    channel: "美团余额+招商银行信用卡(1234)",
    type: "支付",
    date: 1749035130, // 2025-06-04 18:45:30
    amount: 100.00,
    id: "TEST003100040167003503513000"
  },
  {
    支付方式: "支付宝",
    实付金额: "¥50.00",
    备注: "/",
    订单标题: "测试商户D 订单详情",
    交易创建时间: "2025-07-01 10:00:00",
    交易成功时间: "2025-07-01 10:00:05",
    交易类型: "支付",
    '收/支': "支出",
    订单金额: "¥50.00",
    交易单号: "TEST004100040167135680000",
    商家单号: "TEST_MERCHANT_004",
    channel: "支付宝",
    type: "支付",
    date: 1751356800, // 2025-07-01 10:00:00 (超出覆盖范围)
    amount: 50.00,
    id: "TEST004100040167135680000"
  }
];

// 脱敏的微信支付测试数据
export const mockWechatPayments: WechatPayment[] = [
  {
    交易时间: "2025-06-03 12:30:20",
    '金额(元)': "¥25.50",
    支付方式: "招商银行储蓄卡(9999)",
    商户单号: "TEST_WECHAT_MERCHANT_001",
    备注: "/",
    当前状态: "退款成功",
    交易类型: "商户退款",
    交易对方: "美团",
    商品: "测试商品退款",
    '收/支': "收入",
    交易单号: "420000281120250603050695512400",
    channel: "微信支付",
    date: 1748925020, // 2025-06-03 12:30:20 (比美团订单晚5秒)
    amount: 25.50,
    type: "商户退款",
    id: "420000281120250603050695512400"
  }
];

// 脱敏的支付宝测试数据
export const mockAlipayPayments: AlipayPayment[] = [
  {
    交易时间: "2025-06-02 15:08:25",
    交易分类: "餐饮美食",
    交易对方: "测试商户A",
    对方账号: "test***@example.com",
    商品说明: "测试商品A等商品",
    '收/支': "支出",
    金额: "16.00",
    '收/付款方式': "招商银行信用卡(1234)",
    交易状态: "交易成功",
    交易订单号: "2025060222001486201415930000",
    商家订单号: "TEST_ALIPAY_MERCHANT_001",
    备注: "",
    source: "支付宝",
    date: 1748848105, // 2025-06-02 15:08:25 (比美团订单晚4秒)
    amount: 16.00,
    type: "支出",
    id: "2025060222001486201415930000"
  }
];

// 脱敏的招商银行信用卡测试数据
export const mockCmbCreditCardPayments: CmbCreditCardPayment[] = [
  {
    交易日: "06/02",
    记账日: "06/02",
    交易摘要: "美团支付-测试商户",
    人民币金额: "16.00",
    卡号末四位: "1234",
    交易地金额: "16.00",
    date: 1748848110, // 2025-06-02 15:08:30 (比美团订单晚9秒)
    channel: "招商银行信用卡",
    type: "消费",
    amount: 16.00,
    id: "06/02|美团支付-测试商户|16.00|1234"
  },
  {
    交易日: "06/04",
    记账日: "06/04",
    交易摘要: "美团支付-测试商户C",
    人民币金额: "70.00",
    卡号末四位: "1234",
    交易地金额: "70.00",
    date: 1749035140, // 2025-06-04 18:45:40 (复合渠道的一部分)
    channel: "招商银行信用卡",
    type: "消费",
    amount: 70.00,
    id: "06/04|美团支付-测试商户C|70.00|1234"
  }
];

// 脱敏的招商银行储蓄卡测试数据
export const mockCmbDebitCardPayments: CmbDebitCardPayment[] = [
  {
    记账日期: "2025-06-03",
    货币: "人民币",
    交易金额: "25.50",
    联机余额: "12345.67",
    交易摘要: "快捷支付美团",
    对手信息: "1234567890",
    channel: "招商银行储蓄卡",
    date: 1748925025, // 2025-06-03 12:30:25
    amount: 25.50,
    type: "快捷支付美团",
    id: "2025-06-03|25.50|1234567890|快捷支付美团|12345.67"
  }
];

// 脱敏的美团余额测试数据
export const mockMeituanBalance: MeituanBalance[] = [
  {
    amount: -30.00,
    type: "消费",
    name: "美团订单消费",
    date: 1749035135, // 2025-06-04 18:45:35 (复合渠道的另一部分)
    channel: "美团余额",
    id: "TEST_BALANCE_001"
  }
];

// 测试用的GroupData
export const mockGroupData: GroupData[] = [
  {
    "wechat": {
      channel: "微信支付",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: mockWechatPayments
    },
    "alipay": {
      channel: "支付宝",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: mockAlipayPayments
    }
  },
  {
    "cmb_credit": {
      channel: "招商银行信用卡",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: mockCmbCreditCardPayments
    },
    "cmb_debit": {
      channel: "招商银行储蓄卡",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: mockCmbDebitCardPayments
    },
    "meituan_balance": {
      channel: "美团余额",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: mockMeituanBalance
    }
  }
];

// 期望的DataOutput结果
export const expectedDataOutput: Partial<DataOutput> = {
  "微信支付": mockWechatPayments,
  "支付宝": mockAlipayPayments,
  "招商银行信用卡": mockCmbCreditCardPayments,
  "招商银行储蓄卡": mockCmbDebitCardPayments,
  "美团余额": mockMeituanBalance
};

// 期望的DateList结果
export const expectedDateList: DateList = [
  { channel: "微信支付", date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] },
  { channel: "支付宝", date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] },
  { channel: "招商银行信用卡", date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] },
  { channel: "招商银行储蓄卡", date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] },
  { channel: "美团余额", date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] }
];

// 空数据测试用例
export const emptyGroupData: GroupData[] = [];
export const nullGroupData: GroupData[] = [{}];

// 边界测试数据：包含无效数据的GroupData
export const invalidGroupData: GroupData[] = [
  {
    "invalid": null,
    "empty": {
      channel: "微信支付",
      date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
      data: []
    }
  }
];
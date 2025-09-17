// 统一类型定义文件
// 定义所有支付渠道和数据处理相关的类型
// 英文key作区分为数据处理时添加的字段
/**
 * 美团订单数据格式
 */
export interface MeituanOrder {
  支付方式: string;
  实付金额: string;// ￥\d 需要去除￥
  备注: string;
  订单标题: string;
  交易创建时间: string; // YYYY-MM-DD HH:mm:ss
  交易成功时间: string; // YYYY-MM-DD HH:mm:ss
  交易类型: string;
  '收/支': string;
  订单金额: string;// ￥\d 需要去除￥
  交易单号: string;
  商家单号: string;
  channel: MeituanOrder['支付方式'];
  type: MeituanOrder['交易类型'];
  date: number; // MeituanOrder['交易创建时间'];
  amount: number; // MeituanOrder['实付金额'];
  id: MeituanOrder['交易单号'];
}
export interface MeituanBalanceOCR {
    "amount": number;
    "type": string;
    "name": string;
    "date": string; // YYYY-MM-DD HH:mm:ss
}
// 美团余额
export interface MeituanBalance {
  amount: number; // +440.00 -390.03
  type: string;
  name: string;
  date: number; // YYYY-MM-DD HH:mm:ss
  channel: '美团余额';
  id: string;
}
/**
 * 微信支付数据格式
 */
export interface WechatPayment {
  交易时间: string; // YYYY-MM-DD HH:mm:ss
  '金额(元)': string; // ￥\d 需要去除￥
  支付方式: string;
  商户单号: string;
  备注: string;
  当前状态: string;
  交易类型: string;
  交易对方: string;
  商品: string;
  '收/支': string;
  交易单号: string;
  channel: '微信支付';
  date: number; // WechatPayment['交易时间'];
  amount: number;// WechatPayment['金额(元)'];
  type: WechatPayment['交易类型'];
  id: WechatPayment['交易单号'];
}

/**
 * 招商银行储蓄卡数据格式
 */
export interface CmbDebitCardPayment {
  记账日期: string; // YYYY-MM-DD
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  channel: '招商银行储蓄卡';
  date: number; // CmbDebitCardPayment['记账日期'];
  amount: number; // CmbDebitCardPayment['交易金额'];
  type: CmbDebitCardPayment['交易摘要'];
  id: string; // CmbDebitCardPayment['记账日期'] + CmbDebitCardPayment['交易金额'] + CmbDebitCardPayment['对手信息'] + CmbDebitCardPayment['交易摘要'] + CmbDebitCardPayment['联机余额']
}

/**
 * 招商银行信用卡数据格式
 */
export interface CmbCreditCardPayment {
  交易日: string;
  记账日: string; //  MM/DD x需要拼接年份
  交易摘要: string;
  人民币金额: string;
  卡号末四位: string;
  交易地金额: string;
  date: number; // CmbCreditCardPayment['记账日'];
  channel: '招商银行信用卡';
  type: string;
  amount: number; // CmbCreditCardPayment['人民币金额'];
  id: string; // CmbCreditCardPayment['交易日'] + CmbCreditCardPayment['交易摘要'] + CmbCreditCardPayment['人民币金额'] + CmbCreditCardPayment['卡号末四位']
}

export interface GfCreditCardPayment {
  交易日期: string; // YYYY/MM/DD
  入账日期: string; // YYYY/MM/DD
  交易摘要: string;
  类型: string; // 从交易摘要中提取的类型，如"消费"、"退货"等
  交易金额: string;
  交易货币: string;
  入账金额: string;
  入账货币: string;
  channel: '广发银行信用卡';
  type: GfCreditCardPayment['类型'];
  amount: number; // GfCreditCardPayment['入账金额'];
  date: number; // GfCreditCardPayment['入账日期'];
  id: string; // GfCreditCardPayment['交易日期'] + GfCreditCardPayment['交易摘要'] + GfCreditCardPayment['类型'] + GfCreditCardPayment['入账金额']
}

/**
 * 支付宝数据格式
 */
export interface AlipayPayment {
  交易时间: string; // YYYY-MM-DD HH:mm:ss
  交易分类: string;
  交易对方: string;
  对方账号: string;
  商品说明: string;
  '收/支': string;
  金额: string;
  '收/付款方式': string;
  交易状态: string;
  交易订单号: string;
  商家订单号: string;
  备注: string;
  source: '支付宝';
  date: number; // AlipayPayment['交易时间'];
  amount: number; // AlipayPayment['金额'];
  type: AlipayPayment['收/支'];
  id: string; // AlipayPayment['交易订单号']
}
// todo 新增枚举
/**
 * 支付渠道类型枚举
 */
export type PaymentChannel = '美团余额' | '微信支付' | '招商银行储蓄卡' | '招商银行信用卡' | '支付宝' | '广发银行信用卡';

export type Meituan = '美团';


/**
 * 统一支付数据格式（所有渠道数据的联合类型）
 */
export type PaymentData =
  | WechatPayment
  | CmbDebitCardPayment
  | CmbCreditCardPayment
  | AlipayPayment
  | GfCreditCardPayment
  | MeituanBalance;

/**
 * 渠道数据组（包含渠道信息和数据）
 */
export interface ChannelDataGroup {
  channel: PaymentChannel;
  date: [string, string]; // [开始时间, 结束时间]
  data: PaymentData[];
}

/**
 * 单个Group对象的结构
 */
export interface GroupData {
  [key: string]: ChannelDataGroup | null | undefined;
}

/**
 * 聚合后的渠道数据（用于final.ts的输入）
 * 实际是一个包含多个Group对象的数组
 */
export type AggregatedChannelData = GroupData[];

/**
 * 匹配结果（美团订单与支付数据的配对）
 */
export type MatchResult = {
  [K in Meituan]: MeituanOrder;
} & {
  [K in PaymentChannel]: PaymentData;
};

/**
 * data.ts的输出格式
 */
export type DataOutput = {
  [K in Meituan]: MeituanOrder[];
} & {
  [K in PaymentChannel]: PaymentData[];
};

export type DateList = { channel: PaymentChannel; date: [string, string] }[];
/**
 * 各渠道处理函数的统一输出格式
 */
export interface ChannelProcessOutput<T extends PaymentData> {
  output: {
    channel: PaymentChannel;
    date: string[];
    data: T[];
  };
}

/**
 * 美团数据处理输出格式
 */
export interface MeituanProcessOutput {
  output: MeituanOrder[];
}

/**
 * URL分支检测输出格式
 */
export interface UrlBranchOutput {
  output: PaymentChannel | '';
}

/**
 * Markdown生成器输入格式
 */
export interface MarkdownGeneratorInput {
  params: {
    input: any[];
  };
}

/**
 * Markdown生成器输出格式
 */
export interface MarkdownGeneratorOutput {
  output: string;
}

/**
 * 通用函数参数格式
 */
export interface FunctionArgs<T = any> {
  params: T;
}

/**
 * 通用函数输出格式
 */
export interface FunctionOutput<T = any> {
  output: T;
}


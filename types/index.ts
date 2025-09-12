// 统一类型定义文件
// 定义所有支付渠道和数据处理相关的类型

/**
 * 美团订单数据格式
 */
export interface MeituanOrder {
  支付方式: string;
  实付金额: string;
  备注: string;
  订单标题: string;
  交易创建时间: string;
  交易成功时间: string;
  交易类型: string;
  '收/支': string;
  订单金额: string;
  交易单号: string;
  商家单号: string;
}

/**
 * 微信支付数据格式
 */
export interface WechatPayment {
  交易时间: string;
  '金额(元)': string;
  支付方式: string;
  商户单号: string;
  备注: string;
  当前状态: string;
  交易类型: string;
  交易对方: string;
  商品: string;
  '收/支': string;
  交易单号: string;
  数据来源: string;
}

/**
 * 招商银行储蓄卡数据格式
 */
export interface CmbDebitCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}

/**
 * 招商银行信用卡数据格式（假设）
 */
export interface CmbCreditCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}

/**
 * 支付宝数据格式（假设）
 */
export interface AlipayPayment {
  交易时间: string;
  '金额(元)': string;
  支付方式: string;
  商户单号: string;
  备注: string;
  当前状态: string;
  交易类型: string;
  交易对方: string;
  商品: string;
  '收/支': string;
  交易单号: string;
  数据来源: string;
}

/**
 * 支付渠道类型枚举
 */
export type PaymentChannel = '微信支付' | '招商银行储蓄卡' | '招商银行信用卡' | '支付宝';

/**
 * 统一支付数据格式（所有渠道数据的联合类型）
 */
export type PaymentData =
  | WechatPayment
  | CmbDebitCardPayment
  | CmbCreditCardPayment
  | AlipayPayment;

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
  '美团': MeituanOrder;
  [key: string]: MeituanOrder | PaymentData;
};

/**
 * final.ts的输出格式
 */
export interface FinalOutput {
  multichannel: PaymentData[];
  match: MatchResult[];
  unmatch: MeituanOrder[];
  uncover: MeituanOrder[];
}

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


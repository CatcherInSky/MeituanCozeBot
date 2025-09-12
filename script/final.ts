// 美团订单与支付渠道数据匹配处理
import {
  MeituanOrder,
  PaymentData,
  AggregatedChannelData,
  FinalOutput,
  FunctionArgs,
  ChannelDataGroup,
  MatchResult,
  PaymentChannel,
  getPaymentAmount,
  getPaymentTime,
} from '../types';

// Demo数据已移至测试用例中

type Args = FunctionArgs<{ input: AggregatedChannelData; meituan: MeituanOrder[] }>;
type Output = {
  output: FinalOutput;
};

/**
 * 检查时间是否在指定范围内
 * @param time 要检查的时间
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 是否在范围内
 */
function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeDate = new Date(time);
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  return timeDate >= startDate && timeDate <= endDate;
}

/**
 * 检查支付方式是否匹配渠道
 * @param paymentMethod 支付方式
 * @param channel 渠道
 * @returns 是否匹配
 */
function isPaymentMethodMatchChannel(paymentMethod: string, channel: string): boolean {
  // 使用正则表达式进行模糊匹配
  const channelPattern = channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义特殊字符
  const regex = new RegExp(channelPattern, 'i');
  return regex.test(paymentMethod);
}

/**
 * 提取金额数值（移除货币符号和逗号）
 * @param amount 金额字符串
 * @returns 数值
 */
function extractAmount(amount: string): number {
  if (!amount) return 0;
  const cleaned = amount.replace(/[¥$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * 检查金额是否匹配
 * @param amount1 金额1
 * @param amount2 金额2
 * @returns 是否匹配
 */
function isAmountMatch(amount1: string, amount2: string): boolean {
  const num1 = extractAmount(amount1);
  const num2 = extractAmount(amount2);
  // 允许0.01的误差
  return Math.abs(num1 - num2) < 0.01;
}

/**
 * 为不同支付渠道定制匹配规则
 * @param meituanOrder 美团订单
 * @param paymentData 支付数据
 * @param channel 渠道
 * @returns 是否匹配
 */
function isOrderMatchPaymentData(
  meituanOrder: MeituanOrder,
  paymentData: PaymentData,
  channel: string
): boolean {
  // 基础匹配：金额和时间
  const amountMatch = isAmountMatch(
    meituanOrder['实付金额'] || meituanOrder['订单金额'],
    getPaymentAmount(paymentData)
  );

  if (!amountMatch) return false;

  // 根据渠道定制匹配规则
  switch (channel) {
    case '微信支付': {
      // 微信支付匹配规则：金额 + 交易时间
      const wechatTime = getPaymentTime(paymentData);
      const wechatTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        wechatTime,
        wechatTime
      );
      return wechatTimeMatch;
    }

    case '招商银行储蓄卡': {
      // 招商银行储蓄卡匹配规则：金额 + 交易日期
      const cmbTime = getPaymentTime(paymentData);
      const cmbTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        cmbTime + ' 00:00:00',
        cmbTime + ' 23:59:59'
      );
      return cmbTimeMatch;
    }

    case '招商银行信用卡': {
      // 招商银行信用卡匹配规则：金额 + 交易时间
      const cmbCreditTime = getPaymentTime(paymentData);
      const cmbCreditTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        cmbCreditTime + ' 00:00:00',
        cmbCreditTime + ' 23:59:59'
      );
      return cmbCreditTimeMatch;
    }
    // todo 新增
    default:
      // 默认匹配规则：仅金额
      return true;
  }
}

async function main({ params }: Args): Promise<Output> {
  const { input, meituan } = params;

  // 步骤1：收集所有支付渠道数据到multichannel数组
  const multichannel: PaymentData[] = [];
  const channelGroups: ChannelDataGroup[] = [];

  // 遍历input对象中的每个Group
  for (const groupKey in input) {
    if (Object.prototype.hasOwnProperty.call(input, groupKey)) {
      const groupValue = input[groupKey];
      if (groupValue && typeof groupValue === 'object' && 'channel' in groupValue) {
        const channelData = groupValue as ChannelDataGroup;
        channelGroups.push(channelData);
        multichannel.push(...channelData.data);
      }
    }
  }

  // 步骤2：初始化结果数组
  const match: MatchResult[] = [];
  const unmatch: MeituanOrder[] = [];
  const uncover: MeituanOrder[] = [];

  // 步骤3：遍历每个美团订单进行匹配
  for (const meituanOrder of meituan) {
    let isMatched = false;
    let matchedPaymentData: PaymentData | null = null;
    let matchedChannel = '';

    // 步骤3.1：检查支付方式是否匹配任何渠道
    const paymentMethod = meituanOrder['支付方式'] || '';
    const matchingChannels = channelGroups.filter(group =>
      isPaymentMethodMatchChannel(paymentMethod, group.channel)
    );

    if (matchingChannels.length === 0) {
      // 步骤3.2：支付方式不匹配任何渠道，直接加入uncover
      uncover.push(meituanOrder);
      continue;
    }

    // 步骤3.3：在匹配的渠道中查找对应的支付数据
    for (const channelGroup of matchingChannels) {
      for (const paymentData of channelGroup.data) {
        // 步骤3.4：检查时间是否在渠道的日期范围内
        const timeInRange = isTimeInRange(
          meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
          channelGroup.date[0],
          channelGroup.date[1]
        );

        if (!timeInRange) continue;

        // 步骤3.5：使用渠道特定的匹配规则
        if (isOrderMatchPaymentData(meituanOrder, paymentData, channelGroup.channel)) {
          isMatched = true;
          matchedPaymentData = paymentData;
          matchedChannel = channelGroup.channel;
          break;
        }
      }

      if (isMatched) break;
    }

    // 步骤3.6：根据匹配结果分类
    if (isMatched && matchedPaymentData) {
      // 匹配成功：加入match数组
      match.push([meituanOrder, matchedPaymentData]);
    } else {
      // 匹配失败：加入unmatch数组
      unmatch.push(meituanOrder);
    }
  }

  // 步骤4：返回结果
  return {
    output: {
      multichannel,
      match,
      unmatch,
      uncover,
    },
  };
}

export default main;


// 美团订单与支付渠道数据匹配处理
import dayjs from 'dayjs';
import {
  MeituanOrder,
  PaymentData,
  MatchResult,
  AggregatedChannelData,
  FinalOutput,
  FunctionArgs,
  ChannelDataGroup,
} from '../types';

// Demo数据已移至测试用例中

type Args = FunctionArgs<{ input: AggregatedChannelData; meituan: MeituanOrder[] }>;
type Output = {
  output: FinalOutput;
};

/**
 * 支付渠道字段映射配置
 * 根据数据来源字段直接获取对应的金额、时间、交易类型字段
 */
const CHANNEL_FIELD_MAPPING = {
  '微信支付': {
    amountField: '金额(元)',
    timeField: '交易时间',
    transactionTypeField: '交易类型', // 使用交易类型字段判断收入支出
    descriptionField: '交易对方', // 使用交易对方字段作为文案
    isCreditCard: false,
  },
  '支付宝': {
    amountField: '金额',
    timeField: '交易时间',
    transactionTypeField: '收/支', // 支付宝用收/支分类
    descriptionField: '交易对方',
    isCreditCard: false,
  },
  '招商银行储蓄卡': {
    amountField: '交易金额',
    timeField: '记账日期',
    transactionTypeField: '交易摘要', // 储蓄卡没有专门的收/支字段，用交易摘要
    descriptionField: '对手信息',
    isCreditCard: false,
  },
  '招商银行信用卡': {
    amountField: '人民币金额',
    timeField: '日期',
    transactionTypeField: '类型', // 信用卡用类型字段
    descriptionField: '交易摘要',
    isCreditCard: true,
  },
  '广发银行信用卡': {
    amountField: '交易金额',
    timeField: '交易日期',
    transactionTypeField: '类型', // 广发信用卡用类型字段
    descriptionField: '交易摘要',
    isCreditCard: true,
  },
} as const;

/**
 * 获取支付数据的金额字段值
 */
function getPaymentAmount(data: PaymentData): string {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  if (!mapping) return '';
  
  return (data as any)[mapping.amountField] || '';
}

/**
 * 获取支付数据的时间字段值
 */
function getPaymentTime(data: PaymentData): string {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  if (!mapping) return '';
  
  return (data as any)[mapping.timeField] || '';
}

/**
 * 获取支付数据的交易类型字段值
 */
function getPaymentTransactionType(data: PaymentData): string {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  if (!mapping) return '';
  
  return (data as any)[mapping.transactionTypeField] || '';
}

/**
 * 获取支付数据的描述字段值
 */
function getPaymentDescription(data: PaymentData): string {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  if (!mapping) return '';
  
  return (data as any)[mapping.descriptionField] || '';
}

/**
 * 判断是否为信用卡渠道
 */
function isCreditCardChannel(data: PaymentData): boolean {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  return mapping?.isCreditCard || false;
}




/**
 * 提取金额数值（移除货币符号和逗号，统一转换为数字）
 * @param amount 金额字符串
 * @returns 数值
 */
function extractAmount(amount: string): number {
  if (!amount) return 0;
  const cleaned = amount.replace(/[¥$,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * 检查金额是否匹配（允许0.01的误差）
 * @param amount1 金额1
 * @param amount2 金额2
 * @returns 是否匹配
 */
function isAmountMatch(amount1: string, amount2: string): boolean {
  const num1 = extractAmount(amount1);
  const num2 = extractAmount(amount2);
  const diff = Math.abs(num1 - num2);
  // 使用 0.011 来避免浮点数精度问题
  return diff <= 0.011;
}

/**
 * 预处理支付数据
 * @param data 支付数据
 * @returns 预处理后的数据
 */
function preprocessPaymentData(data: PaymentData): {
  amount: number;
  time: string;
  transactionType: string;
  description: string;
  isCreditCard: boolean;
} {
  const source = data.数据来源 as keyof typeof CHANNEL_FIELD_MAPPING;
  const mapping = CHANNEL_FIELD_MAPPING[source];
  
  if (!mapping) {
    return {
      amount: 0,
      time: '',
      transactionType: '',
      description: '',
      isCreditCard: false,
    };
  }
  
  const amount = extractAmount((data as any)[mapping.amountField] || '');
  const time = normalizeTimeString((data as any)[mapping.timeField] || '');
  const transactionType = (data as any)[mapping.transactionTypeField] || '';
  const description = (data as any)[mapping.descriptionField] || '';
  
  return {
    amount,
    time,
    transactionType,
    description,
    isCreditCard: mapping.isCreditCard,
  };
}

/**
 * 预处理美团订单数据
 * @param order 美团订单
 * @returns 预处理后的数据
 */
function preprocessMeituanOrder(order: MeituanOrder): {
  amount: number;
  time: string;
} {
  const amount = extractAmount(order['实付金额'] || order['订单金额'] || '');
  const time = normalizeTimeString(order['交易创建时间'] || order['交易成功时间'] || '');
  
  return {
    amount,
    time,
  };
}

/**
 * 标准化时间格式
 * @param timeStr 时间字符串
 * @returns 标准化的时间字符串
 */
function normalizeTimeString(timeStr: string): string {
  if (!timeStr) return '';
  
  // 使用dayjs解析时间
  let parsed = dayjs(timeStr);
  
  // 如果解析失败，直接返回原字符串
  if (!parsed.isValid()) {
    return timeStr;
  }
  
  // 如果只有日期没有时间，添加23:59:59
  if (!timeStr.includes(':') && !timeStr.includes(' ')) {
    return parsed.format('YYYY-MM-DD 23:59:59');
  }
  
  // 其他情况直接返回格式化后的时间
  return parsed.format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 检查时间是否在指定范围内
 * @param time 要检查的时间
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 是否在范围内
 */
function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const normalizedTime = normalizeTimeString(time);
  const normalizedStartTime = normalizeTimeString(startTime);
  const normalizedEndTime = normalizeTimeString(endTime);
  
  const timeDate = dayjs(normalizedTime);
  const startDate = dayjs(normalizedStartTime);
  const endDate = dayjs(normalizedEndTime);

  return timeDate.isAfter(startDate) && timeDate.isBefore(endDate) || 
         timeDate.isSame(startDate) || timeDate.isSame(endDate);
}

/**
 * 检查支付渠道时间是否在美团时间后的指定时间窗口内
 * @param paymentTime 支付渠道时间
 * @param meituanTime 美团订单时间
 * @param hours 时间窗口（小时）
 * @returns 是否在时间窗口内
 */
function isPaymentTimeWithinWindow(paymentTime: string, meituanTime: string, hours: number): boolean {
  const normalizedPaymentTime = normalizeTimeString(paymentTime);
  const normalizedMeituanTime = normalizeTimeString(meituanTime);
  
  const paymentDate = dayjs(normalizedPaymentTime);
  const meituanDate = dayjs(normalizedMeituanTime);
  
  // 支付时间应该在美团时间之后
  if (paymentDate.isBefore(meituanDate)) {
    return false;
  }
  
  // 检查是否在指定时间窗口内
  const timeDiff = paymentDate.diff(meituanDate, 'hour');
  return timeDiff <= hours;
}

/**
 * 检查支付方式是否匹配渠道
 * @param paymentMethod 支付方式
 * @param channel 渠道
 * @returns 是否匹配
 */
function isPaymentMethodMatchChannel(paymentMethod: string, channel: string): boolean {
  // 使用正则表达式进行模糊匹配，只要支付方式包含渠道名称即可
  const channelPattern = channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义特殊字符
  const regex = new RegExp(channelPattern, 'i');
  return regex.test(paymentMethod);
}



/**
 * 计算匹配评分
 * @param meituanOrder 美团订单
 * @param paymentData 支付数据
 * @returns 评分结果
 */
function calculateMatchScore(
  meituanOrder: MeituanOrder,
  paymentData: PaymentData
): {
  totalScore: number;
  transactionTypeScore: number;
  timeScore: number;
  descriptionScore: number;
  isMatch: boolean;
} {
  const meituan = preprocessMeituanOrder(meituanOrder);
  const payment = preprocessPaymentData(paymentData);
  
  // 1. 金额必须相等（绝对值）
  if (Math.abs(meituan.amount - payment.amount) > 0.01) {
    return {
      totalScore: 0,
      transactionTypeScore: 0,
      timeScore: 0,
      descriptionScore: 0,
      isMatch: false,
    };
  }
  
  // 2. 交易类型评分（3分、2分、1分）
  let transactionTypeScore = 0;
  if (payment.transactionType.includes('退款')) {
    transactionTypeScore = 3;
  } else if (payment.transactionType.includes('收入')) {
    transactionTypeScore = 2;
  } else if (payment.isCreditCard && payment.amount < 0) {
    transactionTypeScore = 1;
  }
  // 3. 时间评分（3分、2分、1分）
  let timeScore = 0;
  const meituanTime = dayjs(meituan.time);
  const paymentTime = dayjs(payment.time);
  const timeDiffHours = paymentTime.diff(meituanTime, 'hour');
  
  if (timeDiffHours >= 0 && timeDiffHours < 24) {
    timeScore = 3;
  } else if (timeDiffHours >= 0 && timeDiffHours < 48) {
    timeScore = 2;
  } else if (timeDiffHours >= 0 && timeDiffHours < 72) {
    timeScore = 1;
  }
  
  // 4. 文案评分（3分、2分、1分）
  let descriptionScore = 0;
  const combinedText = `${payment.description} ${payment.transactionType}`.toLowerCase();
  const hasMeituan = combinedText.includes('美团') || combinedText.includes('meituan');
  const hasRefund = combinedText.includes('退款');
  
  if (hasMeituan && hasRefund) {
    descriptionScore = 3;
  } else if (hasMeituan || hasRefund) {
    descriptionScore = 2;
  } else {
    // 对于不包含美团和退款的，给1分（基础分）
    descriptionScore = 1;
  }
  
  const totalScore = transactionTypeScore + timeScore + descriptionScore;
  const isMatch = totalScore >= 5 && transactionTypeScore >= 1 && timeScore >= 1 && descriptionScore >= 1;
  
  return {
    totalScore,
    transactionTypeScore,
    timeScore,
    descriptionScore,
    isMatch,
  };
}

/**
 * 统一匹配规则：检查美团订单与支付数据是否匹配
 * @param meituanOrder 美团订单
 * @param paymentData 支付数据
 * @returns 是否匹配
 */
function isOrderMatchPaymentData(
  meituanOrder: MeituanOrder,
  paymentData: PaymentData
): boolean {
  const score = calculateMatchScore(meituanOrder, paymentData);
  return score.isMatch;
}

/**
 * 查找美团订单的匹配支付数据
 * @param meituanOrder 美团订单
 * @param channelGroups 渠道数据组
 * @returns 匹配的支付数据和渠道，如果不匹配返回null
 */
function findMatchingPaymentData(
  meituanOrder: MeituanOrder,
  channelGroups: ChannelDataGroup[]
): { paymentData: PaymentData; channel: string } | null {
  const paymentMethod = meituanOrder['支付方式'] || '';
  
  // 查找匹配的渠道
  const matchingChannels = channelGroups.filter(group =>
    isPaymentMethodMatchChannel(paymentMethod, group.channel)
  );

  // 在匹配的渠道中查找对应的支付数据
  for (const channelGroup of matchingChannels) {
    for (const paymentData of channelGroup.data) {
      // 检查时间是否在渠道的日期范围内
      const timeInRange = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        channelGroup.date[0],
        channelGroup.date[1]
      );

      if (!timeInRange) continue;

      // 使用统一的匹配规则
      if (isOrderMatchPaymentData(meituanOrder, paymentData)) {
        return {
          paymentData,
          channel: channelGroup.channel
        };
      }
    }
  }

  return null;
}

async function main({ params }: Args): Promise<Output> {
  const { input, meituan } = params;

  // 步骤1：收集所有支付渠道数据到multichannel数组
  const multichannel: PaymentData[] = [];
  const channelGroups: ChannelDataGroup[] = [];

  // 遍历input数组中的每个Group
  for (const groupItem of input) {
    if (groupItem && typeof groupItem === 'object') {
      // 遍历每个Group对象中的属性
      for (const groupKey in groupItem) {
        if (Object.prototype.hasOwnProperty.call(groupItem, groupKey)) {
          const groupValue = groupItem[groupKey];
          if (groupValue && typeof groupValue === 'object' && 'channel' in groupValue) {
            const channelData = groupValue as ChannelDataGroup;
            channelGroups.push(channelData);
            multichannel.push(...channelData.data);
          }
        }
      }
    }
  }

  // 步骤2：初始化结果数组
  const match: MatchResult[] = [];
  const unmatch: MeituanOrder[] = [];
  const uncover: MeituanOrder[] = [];

  // 步骤2&3：合并遍历美团订单，同时判断覆盖和匹配
  for (const meituanOrder of meituan) {
    const paymentMethod = meituanOrder['支付方式'] || '';
    const meituanTime = meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'];
    let isCovered = false;
    
    // 检查该订单是否被任何渠道覆盖
    for (const channelGroup of channelGroups) {
      // 1. 判断该退款数据支付方式有没有包含channel字段
      if (!isPaymentMethodMatchChannel(paymentMethod, channelGroup.channel)) {
        continue;
      }
      
      // 2. 判断该退款数据是不是在date范围内
      const timeInRange = isTimeInRange(
        meituanTime,
        channelGroup.date[0],
        channelGroup.date[1]
      );
      
      if (timeInRange) {
        isCovered = true;
        break;
      }
    }
    
    // 如果订单没有被任何渠道覆盖，加入uncover
    if (!isCovered) {
      uncover.push(meituanOrder);
      continue; // 跳过后续匹配逻辑
    }
    
    // 如果订单被覆盖，尝试匹配支付数据
    const matchResult = findMatchingPaymentData(meituanOrder, channelGroups);
    
    if (matchResult) {
      // 匹配成功：加入match数组
      match.push({
        '美团': meituanOrder,
        [matchResult.channel]: matchResult.paymentData
      });
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

// 导出工具函数供测试使用
export {
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
};

export default main;


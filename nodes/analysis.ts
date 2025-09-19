import { MeituanOrder, DateList, DataOutput, PaymentData, FunctionArgs, FunctionOutput } from '../types';

/**
 * 将美团订单数据按照覆盖逻辑分为两组，并进行匹配分析
 * @param dateList 日期列表，包含渠道和起止日期
 * @param meituanOrders 美团订单数据列表
 * @param input 支付数据
 * @returns 包含未被覆盖、已被覆盖、匹配和未匹配的美团订单列表
 */
type Args = FunctionArgs<{ dateList: DateList; meituanOrders: MeituanOrder[]; input: DataOutput }>;
type Output = FunctionOutput<{ 
  uncover: MeituanOrder[]; 
  cover: MeituanOrder[]; 
  match: (MeituanOrder & PaymentData)[]; 
  unmatch: MeituanOrder[]; 
}>;

async function main({ params }: Args): Promise<Output> {
  try {
    const { dateList, meituanOrders, input } = params;
    const uncover: MeituanOrder[] = [];
    const cover: MeituanOrder[] = [];

    // 第一步：覆盖分析
    for (const order of meituanOrders) {
      let isCovered = false;

      // 检查是否为复合渠道（包含+号）
      if (order.channel.includes('+')) {
        // 处理复合渠道：需要所有子渠道都被覆盖
        isCovered = checkCompositeChannelCoverage(order, dateList);
      } else {
        // 处理单一渠道：原有逻辑
        isCovered = checkSingleChannelCoverage(order, dateList);
      }

      // 根据覆盖状态分类
      if (isCovered) {
        cover.push(order);
      } else {
        uncover.push(order);
      }
    }

    // 第二步：匹配分析（仅对已覆盖的订单进行匹配）
    const { match, unmatch } = await performMatching(cover, input);

    return { output: { uncover, cover, match, unmatch } };
  } catch (error) {
    console.error('Error in coverage.ts main function:', error);
    return { 
      output: { 
        uncover: [], 
        cover: [], 
        match: [],
        unmatch: []
      } 
    };
  }
}

/**
 * 为日期字符串添加默认时间
 * @param dateStr 日期字符串
 * @param defaultTime 默认时间
 * @returns 完整的日期时间字符串
 */
function addDefaultTime(dateStr: string, defaultTime: string): string {
  // 如果日期字符串已经包含时间，直接返回
  if (dateStr.includes(' ')) {
    return dateStr;
  }
  
  // 如果只有日期，添加默认时间
  return `${dateStr} ${defaultTime}`;
}

/**
 * 检查单一渠道的覆盖情况
 * @param order 美团订单
 * @param dateList 日期列表
 * @returns 是否被覆盖
 */
function checkSingleChannelCoverage(order: MeituanOrder, dateList: DateList): boolean {
  // 检查当前订单是否被DateList中的任何条目覆盖
  for (const dateItem of dateList) {
    // 检查渠道是否匹配
    if (order.channel.includes(dateItem.channel)) {
      // 解析日期范围
      const [startDateStr, endDateStr] = dateItem.date;
      
      // 如果没有时分秒数据，添加默认时间
      const startDate = addDefaultTime(startDateStr, '00:00:00');
      const endDate = addDefaultTime(endDateStr, '23:59:59');
      
      // 将日期字符串转换为时间戳（秒）进行比较
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      // 检查订单时间是否在日期范围内（order.date 为秒级时间戳）
      if (order.date >= startTimestamp && order.date <= endTimestamp) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 检查复合渠道的覆盖情况
 * @param order 美团订单
 * @param dateList 日期列表
 * @returns 是否被覆盖
 */
function checkCompositeChannelCoverage(order: MeituanOrder, dateList: DateList): boolean {
  // 解析复合渠道，提取各个子渠道
  const subChannels = order.channel.split('+').map(s => s.trim());
  
  // 检查每个子渠道是否都被覆盖
  for (const subChannel of subChannels) {
    let subChannelCovered = false;
    
    // 在dateList中查找匹配的子渠道
    for (const dateItem of dateList) {
      // 使用模糊匹配来查找对应的渠道
      if (subChannel.includes(dateItem.channel) || dateItem.channel.includes(subChannel)) {
        // 解析日期范围
        const [startDateStr, endDateStr] = dateItem.date;
        
        // 如果没有时分秒数据，添加默认时间
        const startDate = addDefaultTime(startDateStr, '00:00:00');
        const endDate = addDefaultTime(endDateStr, '23:59:59');
        
        // 将日期字符串转换为时间戳（秒）进行比较
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        
        // 检查订单时间是否在日期范围内
        if (order.date >= startTimestamp && order.date <= endTimestamp) {
          subChannelCovered = true;
          break;
        }
      }
    }
    
    // 如果任何一个子渠道没有被覆盖，整个复合渠道就没有被覆盖
    if (!subChannelCovered) {
      return false;
    }
  }
  
  // 所有子渠道都被覆盖
  return true;
}

/**
 * 执行匹配分析
 * @param cover 已覆盖的美团订单列表
 * @param input 支付数据
 * @returns 匹配和未匹配的结果
 */
async function performMatching(cover: MeituanOrder[], input: DataOutput): Promise<{ match: (MeituanOrder & PaymentData)[]; unmatch: MeituanOrder[] }> {
  const match: (MeituanOrder & PaymentData)[] = [];
  const unmatch: MeituanOrder[] = [];

  // 遍历美团订单数据
  for (const meituanOrder of cover) {
    const channel = meituanOrder.channel;
    
    // 检查是否为复合渠道（包含+号）
    if (channel.includes('+')) {
      // 处理复合渠道匹配
      const compositeMatch = findCompositeMatch(meituanOrder, input);
      if (compositeMatch) {
        match.push(compositeMatch);
      } else {
        unmatch.push(meituanOrder);
      }
    } else {
      // 处理单一渠道匹配
      const paymentDataList = getPaymentDataByChannel(input, channel);
      
      if (paymentDataList.length === 0) {
        // 如果没有对应的支付数据，直接加入未匹配列表
        unmatch.push(meituanOrder);
        continue;
      }

      // 找到最佳匹配
      const bestMatch = findBestMatch(meituanOrder, paymentDataList);
      
      if (bestMatch) {
        // 合并美团订单和支付数据
        const matchedData = { ...meituanOrder, ...bestMatch };
        match.push(matchedData);
      } else {
        unmatch.push(meituanOrder);
      }
    }
  }

  return { match, unmatch };
}

/**
 * 找到最佳匹配的支付数据
 */
function findBestMatch(meituanOrder: MeituanOrder, paymentDataList: PaymentData[]): PaymentData | null {
  let bestMatch: PaymentData | null = null;
  let bestScore = 0;

  for (const paymentData of paymentDataList) {
    // 金额必须相同（绝对值）
    if (Math.abs(meituanOrder.amount) !== Math.abs(paymentData.amount)) {
      continue;
    }

    const score = calculateMatchScore(meituanOrder, paymentData);
    
    // 每项都必须大于1分且总分大于等于4分则匹配
    if (score.total >= 4 && score.date >= 1 && score.type >= 1) {
      if (score.total > bestScore) {
        bestScore = score.total;
        bestMatch = paymentData;
      }
    }
  }

  return bestMatch;
}

/**
 * 计算匹配评分
 */
function calculateMatchScore(meituanOrder: MeituanOrder, paymentData: PaymentData): { total: number; date: number; type: number } {
  // 时间差评分
  const dateScore = calculateDateScore(meituanOrder.date, paymentData.date);
  
  // 类型匹配评分
  const typeScore = calculateTypeScore(meituanOrder, paymentData);
  
  return {
    total: dateScore + typeScore,
    date: dateScore,
    type: typeScore
  };
}

/**
 * 计算时间差评分
 */
function calculateDateScore(meituanDate: number, paymentDate: number): number {
  const timeDiff = Math.abs(meituanDate - paymentDate);
  const hoursDiff = timeDiff / (1000 * 60 * 60); // 转换为小时

  if (hoursDiff < 2) {
    return 3; // 相差小于2h 3分
  } else if (hoursDiff < 24) {
    return 2; // 相差小于24h 2分
  } else if (hoursDiff < 48) {
    return 1; // 相差小于48h 1分
  }
  
  return 0;
}

/**
 * 计算类型匹配评分
 */
function calculateTypeScore(meituanOrder: MeituanOrder, paymentData: PaymentData): number {
  const paymentStr = JSON.stringify(paymentData);
  const hasMeituan = paymentStr.includes('美团');
  const hasRefund = paymentData.type.includes('退款');
  const hasIncome = paymentData.type.includes('收入');

  // PaymentData.type 包含退款 且 json.stringify(PaymentData) 包含美团 3分
  if (hasRefund && hasMeituan) {
    return 3;
  }
  
  // PaymentData.type 包含收入 且 json.stringify(PaymentData) 包含美团 2分
  if (hasIncome && hasMeituan) {
    return 2;
  }
  
  // PaymentData.type 包含退款 或 json.stringify(PaymentData) 包含美团 1分
  if (hasRefund || hasMeituan) {
    return 1;
  }
  
  return 0;
}

/**
 * 根据渠道名称获取支付数据列表（支持模糊匹配）
 */
function getPaymentDataByChannel(input: DataOutput, channel: string): PaymentData[] {
  const allChannels = Object.keys(input) as (keyof DataOutput)[];
  
  // 查找匹配的渠道（使用includes进行模糊匹配）
  const matchedChannels = allChannels.filter(key => 
    key !== '美团' && channel.includes(key)
  );
  
  // 合并所有匹配渠道的数据
  const allPaymentData: PaymentData[] = [];
  for (const matchedChannel of matchedChannels) {
    const channelData = (input as any)[matchedChannel];
    if (Array.isArray(channelData)) {
      allPaymentData.push(...channelData);
    }
  }
  
  return allPaymentData;
}

/**
 * 处理复合渠道匹配（如：美团余额+招商银行信用卡）
 */
function findCompositeMatch(meituanOrder: MeituanOrder, input: DataOutput): (MeituanOrder & PaymentData) | null {
  const channel = meituanOrder.channel;
  
  // 解析复合渠道，提取各个子渠道
  const subChannels = channel.split('+').map(s => s.trim());
  
  // 获取所有子渠道的支付数据
  const channelDataMap = new Map<string, PaymentData[]>();
  for (const subChannel of subChannels) {
    const paymentData = getPaymentDataByChannel(input, subChannel);
    if (paymentData.length > 0) {
      channelDataMap.set(subChannel, paymentData);
    }
  }
  
  // 如果没有找到任何子渠道的数据，返回null
  if (channelDataMap.size === 0) {
    return null;
  }
  
  // 尝试找到金额组合匹配
  const bestCombination = findBestAmountCombination(meituanOrder, channelDataMap);
  
  if (bestCombination) {
    // 合并美团订单和第一个支付数据（作为主要支付数据）
    const primaryPayment = bestCombination[0];
    return { ...meituanOrder, ...primaryPayment };
  }
  
  return null;
}

/**
 * 找到最佳金额组合匹配
 */
function findBestAmountCombination(
  meituanOrder: MeituanOrder, 
  channelDataMap: Map<string, PaymentData[]>
): PaymentData[] | null {
  const targetAmount = Math.abs(meituanOrder.amount);
  const channels = Array.from(channelDataMap.keys());
  
  // 生成所有可能的组合
  const combinations = generateCombinations(channels, channelDataMap);
  
  let bestCombination: PaymentData[] | null = null;
  let bestScore = 0;
  
  for (const combination of combinations) {
    // 检查金额是否匹配
    const totalAmount = combination.reduce((sum, payment) => sum + Math.abs(payment.amount), 0);
    if (Math.abs(totalAmount - targetAmount) > 0.01) { // 允许0.01的浮点数误差
      continue;
    }
    
    // 计算组合的总评分
    const totalScore = calculateCombinationScore(meituanOrder, combination);
    
    // 检查是否满足最低要求（每项都必须大于1分且总分大于等于4分）
    if (totalScore.total >= 4 && totalScore.date >= 1 && totalScore.type >= 1) {
      if (totalScore.total > bestScore) {
        bestScore = totalScore.total;
        bestCombination = combination;
      }
    }
  }
  
  return bestCombination;
}

/**
 * 生成所有可能的支付数据组合
 */
function generateCombinations(
  channels: string[], 
  channelDataMap: Map<string, PaymentData[]>
): PaymentData[][] {
  const combinations: PaymentData[][] = [];
  
  // 递归生成所有可能的组合
  function generateRecursive(index: number, currentCombination: PaymentData[]) {
    if (index === channels.length) {
      if (currentCombination.length > 0) {
        combinations.push([...currentCombination]);
      }
      return;
    }
    
    const channel = channels[index];
    const channelData = channelDataMap.get(channel) || [];
    
    // 不选择当前渠道的数据
    generateRecursive(index + 1, currentCombination);
    
    // 选择当前渠道的每个数据
    for (const paymentData of channelData) {
      currentCombination.push(paymentData);
      generateRecursive(index + 1, currentCombination);
      currentCombination.pop();
    }
  }
  
  generateRecursive(0, []);
  return combinations;
}

/**
 * 计算组合的总评分
 */
function calculateCombinationScore(meituanOrder: MeituanOrder, combination: PaymentData[]): { total: number; date: number; type: number } {
  let totalDateScore = 0;
  let totalTypeScore = 0;
  
  for (const paymentData of combination) {
    const score = calculateMatchScore(meituanOrder, paymentData);
    totalDateScore = Math.max(totalDateScore, score.date); // 取最高的时间评分
    totalTypeScore = Math.max(totalTypeScore, score.type); // 取最高的类型评分
  }
  
  return {
    total: totalDateScore + totalTypeScore,
    date: totalDateScore,
    type: totalTypeScore
  };
}

export default main;



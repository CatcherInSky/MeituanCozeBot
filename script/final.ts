// 美团订单与支付渠道数据匹配处理
import {
  MeituanOrder,
  PaymentData,
  MatchResult,
  AggregatedChannelData,
  FinalOutput,
  FunctionArgs,
  ChannelDataGroup,
  WechatPayment,
  CmbDebitCardPayment,
  CmbCreditCardPayment,
  GfCreditCardPayment,
  AlipayPayment,
} from '../types';

// Demo数据已移至测试用例中

type Args = FunctionArgs<{ input: AggregatedChannelData; meituan: MeituanOrder[] }>;
type Output = {
  output: FinalOutput;
};




/**
 * 类型守卫函数：检查是否为微信支付数据
 */
function isWechatPayment(data: PaymentData): data is WechatPayment {
  return '交易时间' in data && '金额(元)' in data && data.数据来源 === '微信支付';
}

/**
 * 类型守卫函数：检查是否为招商银行储蓄卡数据
 */
function isCmbDebitCardPayment(data: PaymentData): data is CmbDebitCardPayment {
  return '记账日期' in data && '交易金额' in data && data.数据来源 === '招商银行储蓄卡';
}

/**
 * 类型守卫函数：检查是否为招商银行信用卡数据
 */
function isCmbCreditCardPayment(data: PaymentData): data is CmbCreditCardPayment {
  return '记账日' in data && '人民币金额' in data && data.数据来源 === '招商银行信用卡';
}

/**
 * 类型守卫函数：检查是否为广发银行信用卡数据
 */
function isGfCreditCardPayment(data: PaymentData): data is GfCreditCardPayment {
  return '交易日期' in data && '交易金额' in data && data.数据来源 === '广发银行信用卡';
}

/**
 * 类型守卫函数：检查是否为支付宝数据
 */
function isAlipayPayment(data: PaymentData): data is AlipayPayment {
  return '交易时间' in data && '金额' in data && data.数据来源 === '支付宝';
}

/**
 * 获取支付数据的金额字段
 */
function getPaymentAmount(data: PaymentData): string {
  if (isWechatPayment(data)) {
    return data['金额(元)'];
  }
  if (isAlipayPayment(data)) {
    return data.金额;
  }
  if (isCmbDebitCardPayment(data)) {
    return data.交易金额;
  }
  if (isCmbCreditCardPayment(data)) {
    return data.人民币金额;
  }
  if (isGfCreditCardPayment(data)) {
    return data.交易金额;
  }
  return '';
}

/**
 * 获取支付数据的时间字段
 */
function getPaymentTime(data: PaymentData): string {
  if (isWechatPayment(data) || isAlipayPayment(data)) {
    return data.交易时间;
  }
  if (isCmbDebitCardPayment(data)) {
    return data.记账日期;
  }
  if (isCmbCreditCardPayment(data)) {
    return data.记账日;
  }
  if (isGfCreditCardPayment(data)) {
    return data.交易日期;
  }
  return '';
}

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
  // 根据渠道定制匹配规则
  switch (channel) {
    case '微信支付': {
      // 微信支付匹配规则：多种匹配策略
      if (isWechatPayment(paymentData)) {
        const wechatMerchantId = paymentData.商户单号 || '';
        const meituanMerchantId = meituanOrder.商家单号 || '';
        const wechatTime = getPaymentTime(paymentData);
        const meituanTime = meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'];
        
        // 策略1：商户单号完全匹配
        if (wechatMerchantId.includes(meituanMerchantId) || meituanMerchantId.includes(wechatMerchantId)) {
          return true;
        }
        
        // 策略2：商户单号部分匹配（包含美团订单号）
        if (wechatMerchantId.includes('美团') && meituanMerchantId.includes('美团')) {
          // 提取美团订单号进行匹配
          const wechatOrderMatch = wechatMerchantId.match(/(\d{10,})/);
          const meituanOrderMatch = meituanMerchantId.match(/(\d{10,})/);
          
          if (wechatOrderMatch && meituanOrderMatch) {
            const wechatOrderId = wechatOrderMatch[1];
            const meituanOrderId = meituanOrderMatch[1];
            
            // 如果订单号相同或包含关系，则匹配
            if (wechatOrderId === meituanOrderId || 
                wechatOrderId.includes(meituanOrderId) || 
                meituanOrderId.includes(wechatOrderId)) {
              return true;
            }
          }
        }
        
        // 策略3：金额和时间匹配（允许一定误差）
        const amountMatch = isAmountMatch(
          meituanOrder['实付金额'] || meituanOrder['订单金额'],
          getPaymentAmount(paymentData)
        );
        
        if (amountMatch) {
          // 时间匹配：允许前后30分钟的时间误差
          const wechatDate = new Date(wechatTime);
          const meituanDate = new Date(meituanTime);
          const timeDiff = Math.abs(wechatDate.getTime() - meituanDate.getTime());
          const timeMatch = timeDiff <= 30 * 60 * 1000; // 30分钟
          
          if (timeMatch) {
            return true;
          }
        }
        
        // 策略4：特殊处理退款情况
        // 如果美团订单是退款，微信支付数据也包含退款信息
        if (meituanOrder.交易类型 === '退款' && 
            (paymentData.当前状态?.includes('退款') || paymentData.交易类型?.includes('退款'))) {
          // 对于退款，只要时间在合理范围内就匹配
          const wechatDate = new Date(wechatTime);
          const meituanDate = new Date(meituanTime);
          const timeDiff = Math.abs(wechatDate.getTime() - meituanDate.getTime());
          const timeMatch = timeDiff <= 60 * 60 * 1000; // 1小时
          
          if (timeMatch) {
            return true;
          }
        }
      }

      return false;
    }

    case '招商银行储蓄卡': {
      // 招商银行储蓄卡匹配规则：金额 + 交易日期
      const amountMatch = isAmountMatch(
        meituanOrder['实付金额'] || meituanOrder['订单金额'],
        getPaymentAmount(paymentData)
      );

      if (!amountMatch) return false;

      const cmbTime = getPaymentTime(paymentData);
      const cmbTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        cmbTime + ' 00:00:00',
        cmbTime + ' 23:59:59'
      );
      return cmbTimeMatch;
    }

    case '招商银行信用卡': {
      // 招商银行信用卡匹配规则：金额 + 交易日期
      const amountMatch = isAmountMatch(
        meituanOrder['实付金额'] || meituanOrder['订单金额'],
        getPaymentAmount(paymentData)
      );

      if (!amountMatch) return false;

      const cmbCreditTime = getPaymentTime(paymentData);
      const cmbCreditTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        cmbCreditTime + ' 00:00:00',
        cmbCreditTime + ' 23:59:59'
      );
      return cmbCreditTimeMatch;
    }

    case '支付宝': {
      // 支付宝匹配规则：金额 + 时间 + 商户单号匹配
      const amountMatch = isAmountMatch(
        meituanOrder['实付金额'] || meituanOrder['订单金额'],
        getPaymentAmount(paymentData)
      );

      if (!amountMatch) return false;

      // 时间匹配：允许一定的时间误差
      const alipayTime = getPaymentTime(paymentData);
      const meituanTime = meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'];
      
      const alipayDate = new Date(alipayTime);
      const meituanDate = new Date(meituanTime);
      
      // 允许前后5分钟的时间误差
      const timeDiff = Math.abs(alipayDate.getTime() - meituanDate.getTime());
      const timeMatch = timeDiff <= 5 * 60 * 1000;

      if (!timeMatch) return false;

      // 商户单号匹配
      if (isAlipayPayment(paymentData)) {
        const alipayMerchantId = paymentData.商家订单号 || '';
        const meituanMerchantId = meituanOrder.商家单号 || '';
        
        if (alipayMerchantId.includes(meituanMerchantId) || meituanMerchantId.includes(alipayMerchantId)) {
          return true;
        }
        
        // 如果商户单号不匹配，但金额和时间都匹配，也认为匹配
        return true;
      }

      return false;
    }

    default:
      // 未知渠道，不匹配
      return false;
  }
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
      // 匹配成功：加入match数组，使用新的对象格式
      match.push({
        '美团': meituanOrder,
        [matchedChannel]: matchedPaymentData
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
  isWechatPayment,
  isCmbDebitCardPayment,
  isCmbCreditCardPayment,
  isGfCreditCardPayment,
  isAlipayPayment,
  getPaymentAmount,
  getPaymentTime,
};

export default main;


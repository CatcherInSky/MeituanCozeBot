// 美团订单与支付渠道数据匹配处理

const demo = {
  meituan: [
    {
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
    },
  ],
  input: [
    {
      Group1: {
        channel: '微信支付',
        date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
        data: [
          {
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
          },
        ],
      },
      Group2: {
        channel: '招商银行储蓄卡',
        date: ['2024-09-06 00:00:00', '2025-09-06 23:59:59'],
        data: [
          {
            记账日期: '2024-09-15',
            货币: 'CNY',
            交易金额: '-50.00',
            联机余额: '760.81',
            交易摘要: '快捷支付岭南通',
            对手信息: '123',
            数据来源: '招商银行储蓄卡',
          },
        ],
      },
    },
  ],
  output: {
    multichannel: [],
    match: [],
    unmatch: [],
    uncover: [],
  },
};

type Args = { params: { input: any; meituan: any[] } };
type Output = {
  output: {
    multichannel: any[];
    match: any[][];
    unmatch: any[];
    uncover: any[];
  };
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
function isOrderMatchPaymentData(meituanOrder: any, paymentData: any, channel: string): boolean {
  // 基础匹配：金额和时间
  const amountMatch = isAmountMatch(
    meituanOrder['实付金额'] || meituanOrder['订单金额'],
    paymentData['金额(元)'] || paymentData['交易金额']
  );

  if (!amountMatch) return false;

  // 根据渠道定制匹配规则
  switch (channel) {
    case '微信支付':
      // 微信支付匹配规则：金额 + 交易时间
      const wechatTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        paymentData['交易时间'],
        paymentData['交易时间']
      );
      return wechatTimeMatch;

    case '招商银行储蓄卡':
      // 招商银行储蓄卡匹配规则：金额 + 交易日期
      const cmbTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        paymentData['记账日期'] + ' 00:00:00',
        paymentData['记账日期'] + ' 23:59:59'
      );
      return cmbTimeMatch;

    case '招商银行信用卡':
      // 招商银行信用卡匹配规则：金额 + 交易时间
      const cmbCreditTimeMatch = isTimeInRange(
        meituanOrder['交易成功时间'] || meituanOrder['交易创建时间'],
        paymentData['交易成功时间'] || paymentData['交易创建时间'],
        paymentData['交易成功时间'] || paymentData['交易创建时间']
      );
      return cmbCreditTimeMatch;
    // todo 新增
    default:
      // 默认匹配规则：仅金额
      return true;
  }
}

async function main({ params }: Args): Promise<Output> {
  const { input, meituan } = params;

  // 步骤1：收集所有支付渠道数据到multichannel数组
  const multichannel: any[] = [];
  const channelGroups: Array<{ channel: string; date: string[]; data: any[] }> = [];

  // 遍历input数组中的每个Group
  for (const group of input as any[]) {
    for (const groupKey in group) {
      if (group.hasOwnProperty(groupKey)) {
        const groupValue = group[groupKey];
        if (groupValue && typeof groupValue === 'object' && 'channel' in groupValue) {
          const channelData = groupValue as { channel: string; date: string[]; data: any[] };
          channelGroups.push(channelData);
          multichannel.push(...channelData.data);
        }
      }
    }
  }

  // 步骤2：初始化结果数组
  const match: any[][] = [];
  const unmatch: any[] = [];
  const uncover: any[] = [];

  // 步骤3：遍历每个美团订单进行匹配
  for (const meituanOrder of meituan) {
    let isMatched = false;
    let matchedPaymentData: any = null;
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
    if (isMatched) {
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

// 测试函数
async function testFinal() {
  console.log('=== 美团订单与支付渠道数据匹配测试 ===');
  const result = await main({ params: demo });
  console.log('处理结果:');
  console.log('multichannel数据条数:', result.output.multichannel.length);
  console.log('match匹配对数:', result.output.match.length);
  console.log('unmatch未匹配条数:', result.output.unmatch.length);
  console.log('uncover未覆盖条数:', result.output.uncover.length);
  console.log('\n详细结果:');
  console.log(JSON.stringify(result, null, 2));
}

// 取消注释下面的行来运行测试
// testFinal().catch(console.error);

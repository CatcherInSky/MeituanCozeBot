// 微信支付demo数据，由单个xlsx解析出起止日期，还有每条交易流水详情
import { WechatPayment, ChannelProcessOutput, FunctionArgs } from '../../types';

// Demo数据已移至测试用例中

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<WechatPayment>;

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 解析输入数据
  let parsedData: any[] = [];
  try {
    parsedData = JSON.parse(input);
  } catch (error) {
    console.warn('Failed to parse input JSON:', error);
    return {
      output: {
        channel: '微信支付',
        date: [],
        data: [],
      },
    };
  }

  const transactions: any[] = [];
  let dateRange: string[] = [];
  let foundDataStart = false;

  // 遍历解析后的数据，提取交易记录和日期范围
  for (const item of parsedData) {
    const wechatField = item['微信支付账单明细'];

    // 检查是否包含起始时间和终止时间的行
    if (wechatField && wechatField.includes('起始时间：') && wechatField.includes('终止时间：')) {
      // 使用正则表达式提取起始时间和终止时间
      const startTimeMatch = wechatField.match(/起始时间：\[([^\]]+)\]/);
      const endTimeMatch = wechatField.match(/终止时间：\[([^\]]+)\]/);

      if (startTimeMatch && endTimeMatch) {
        dateRange = [startTimeMatch[1], endTimeMatch[1]];
      }
      continue;
    }

    // 检查是否找到微信支付账单明细列表分隔线标识
    if (wechatField && wechatField.includes('----------------------微信支付账单明细列表--------------------')) {
      foundDataStart = true;
      continue;
    }

    // 检查是否包含交易时间（格式：YYYY-MM-DD HH:mm:ss）
    const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    // 只有在找到数据开始标识后才开始处理交易记录
    if (!foundDataStart) {
      continue;
    }

    // 跳过标题行、统计信息和空行
    if (
      !wechatField ||
      wechatField.includes('微信昵称') ||
      wechatField.includes('起始时间') ||
      wechatField.includes('导出类型') ||
      wechatField.includes('导出时间') ||
      wechatField.includes('共') ||
      wechatField.includes('收入：') ||
      wechatField.includes('支出：') ||
      wechatField.includes('中性交易：') ||
      wechatField.includes('注：') ||
      wechatField.includes('1.') ||
      wechatField.includes('2.') ||
      wechatField.includes('3.') ||
      wechatField.includes('----------------------') ||
      wechatField === '交易时间' ||
      wechatField === null
    ) {
      continue;
    }

    // 检查是否包含有效的交易时间
    if (timePattern.test(wechatField)) {
      // 提取交易记录，映射字段名
      const transaction = {
        交易时间: wechatField,
        '金额(元)': item['Unnamed: 5'] || '',
        支付方式: item['Unnamed: 6'] || '',
        商户单号: item['Unnamed: 9'] || '',
        备注: item['Unnamed: 10'] || '',
        当前状态: item['Unnamed: 7'] || '',
        交易类型: item['Unnamed: 1'] || '',
        交易对方: item['Unnamed: 2'] || '',
        商品: item['Unnamed: 3'] || '',
        '收/支': item['Unnamed: 4'] || '',
        交易单号: item['Unnamed: 8'] || '',
        数据来源: '微信支付',
      };

      transactions.push(transaction);
    }
  }

  return {
    output: {
      channel: '微信支付',
      date: dateRange,
      data: transactions,
    },
  };
}

export default main;

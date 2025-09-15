// 支付宝demo数据处理，由单个CSV解析出起止日期，还有每条交易流水详情
import { AlipayPayment, ChannelProcessOutput, FunctionArgs } from '../../types';

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<AlipayPayment>;

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 解析输入数据
  let parsedData: any[][] = [];
  try {
    parsedData = JSON.parse(input);
  } catch (error) {
    console.warn('Failed to parse input JSON:', error);
    return {
      output: {
        channel: '支付宝',
        date: [],
        data: [],
      },
    };
  }

  const transactions: AlipayPayment[] = [];
  let dateRange: string[] = [];

  // 查找日期范围：起始时间：[YYYY-MM-DD HH:mm:ss]    终止时间：[YYYY-MM-DD HH:mm:ss]
  // 注意支付宝的起始时间和终止时间之间有多个空格
  for (const row of parsedData) {
    if (Array.isArray(row) && row[0] && typeof row[0] === 'string') {
      const dateMatch = row[0].match(/起始时间：\[([^\]]+)\]\s+终止时间：\[([^\]]+)\]/);
      if (dateMatch) {
        dateRange = [dateMatch[1], dateMatch[2]];
        break;
      }
    }
  }

  // 查找数据开始标识：------------------------支付宝（中国）网络技术有限公司  电子客户回单------------------------
  let dataStartIndex = -1;
  let headerIndex = -1;

  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];
    if (Array.isArray(row) && row[0] && typeof row[0] === 'string') {
      // 查找分隔线
      if (row[0].includes('支付宝（中国）网络技术有限公司') && row[0].includes('电子客户回单')) {
        dataStartIndex = i;
        continue;
      }
      
      // 在分隔线后查找表头
      if (dataStartIndex !== -1 && headerIndex === -1) {
        if (row[0] === '交易时间' && row[1] === '交易分类') {
          headerIndex = i;
          break;
        }
      }
    }
  }

  // 解析交易数据（表头下一行开始）
  if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      // 检查是否是有效的交易数据行
      if (Array.isArray(row) && row.length >= 11 && row[0] && row[1]) {
        try {
          const transaction: AlipayPayment = {
            交易时间: row[0] || '',
            交易分类: row[1] || '',
            交易对方: row[2] || '',
            对方账号: row[3] || '',
            商品说明: row[4] || '',
            '收/支': row[5] || '',
            金额: row[6] || '',
            '收/付款方式': row[7] || '',
            交易状态: row[8] || '',
            交易订单号: row[9] || '',
            商家订单号: row[10] || '',
            备注: row[11] || '',
            数据来源: '支付宝',
          };

          transactions.push(transaction);
        } catch (error) {
          console.warn('Error parsing alipay transaction:', error, row);
        }
      }
    }
  }

  return {
    output: {
      channel: '支付宝',
      date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
      data: transactions,
    },
  };
}

export default main;

// 支付宝demo数据处理，由单个CSV解析出起止日期，还有每条交易流水详情
import { AlipayPayment, ChannelProcessOutput, FunctionArgs } from '../../types';
import dayjs from 'dayjs';

// 内联工具函数 - 用于 Coze 节点（只支持 dayjs 导入）
/**
 * 将日期字符串转换为秒级时间戳
 * @param dateStr 日期字符串
 * @param dateRange 日期范围，用于补齐缺失的年份
 * @returns 秒级时间戳
 */
function parseDateToTimestamp(dateStr: string, dateRange?: [string, string]): number {
  if (!dateStr) return 0;
  
  let parsedDate: dayjs.Dayjs;
  
  // 处理不同格式的日期
  if (dateStr.includes('/')) {
    // YYYY/MM/DD 或 MM/DD 格式
    if (dateStr.split('/').length === 2) {
      // MM/DD 格式，需要补齐年份
      if (dateRange && dateRange.length === 2) {
        const startYear = dayjs(dateRange[0]).year();
        const endYear = dayjs(dateRange[1]).year();
        // 使用开始年份，如果月份大于开始月份则使用结束年份
        const month = parseInt(dateStr.split('/')[0]);
        const startMonth = dayjs(dateRange[0]).month() + 1;
        const year = month >= startMonth ? startYear : endYear;
        parsedDate = dayjs(`${year}/${dateStr}`);
      } else {
        // 没有日期范围，使用当前年份
        parsedDate = dayjs(`${dayjs().year()}/${dateStr}`);
      }
    } else {
      // YYYY/MM/DD 格式
      parsedDate = dayjs(dateStr);
    }
  } else if (dateStr.includes('-')) {
    // YYYY-MM-DD 格式
    parsedDate = dayjs(dateStr);
  } else {
    // 其他格式，尝试直接解析
    parsedDate = dayjs(dateStr);
  }
  
  // 如果没有时分秒，补齐为 23:59:59
  if (!dateStr.includes(':')) {
    parsedDate = parsedDate.hour(23).minute(59).second(59);
  }
  
  return parsedDate.unix();
}

/**
 * 解析金额字符串，去除货币符号，保留正负号
 * @param amountStr 金额字符串
 * @returns 数字金额
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // 去除货币符号（￥、$、€等）和空格
  let cleaned = amountStr.replace(/[￥$€£¥\s]/g, '');
  
  // 转换为数字
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? 0 : amount;
}

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<AlipayPayment>;

async function main({ params }: Args): Promise<Output> {
  try {
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
            source: '支付宝',
            date: parseDateToTimestamp(row[0] || '', dateRange as [string, string]),
            amount: parseAmount(row[6] || ''),
            type: row[5] || '',
            id: (row[9] || '').toString(),
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
  } catch (error) {
    console.error('Error in alipay_file_process.ts main function:', error);
    return {
      output: {
        channel: '支付宝',
        date: [],
        data: [],
      },
    };
  }
}

export default main;

// 微信支付demo数据，由单个xlsx解析出起止日期，还有每条交易流水详情
import { WechatPayment, ChannelProcessOutput, FunctionArgs } from '../../types';
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

// Demo数据已移至测试用例中

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<WechatPayment>;

async function main({ params }: Args): Promise<Output> {
  try {
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
        channel: '微信支付',
        date: parseDateToTimestamp(wechatField, dateRange as [string, string]),
        amount: parseAmount(item['Unnamed: 5'] || ''),
        type: item['Unnamed: 1'] || '',
        id: (item['Unnamed: 8'] || '').toString(),
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
  } catch (error) {
    console.error('Error in wechat_file_process.ts main function:', error);
    return {
      output: {
        channel: '微信支付',
        date: [],
        data: [],
      },
    };
  }
}

export default main;

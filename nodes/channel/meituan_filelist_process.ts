// 美团订单数据处理 - 专门处理退款类型的交易记录
// 输入：美团交易账单明细的JSON字符串数组
// 输出：过滤后的退款交易记录列表（已去重和排序）
import { MeituanOrder, MeituanProcessOutput, FunctionArgs } from '../../types';
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

/**
 * 根据id字段去重
 * @param items 数据数组
 * @returns 去重后的数组
 */
function deduplicateById<T extends { id?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.id) return true; // 如果没有id字段，保留
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * 按date字段降序排序
 * @param items 数据数组
 * @returns 排序后的数组
 */
function sortByDateDesc<T extends { date?: number }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const dateA = a.date || 0;
    const dateB = b.date || 0;
    return dateB - dateA; // 降序
  });
}

type Args = FunctionArgs<{ input: string[] }>;
type Output = MeituanProcessOutput;

// 美团订单数据处理 - 解析并过滤退款交易数据
async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;

    // 存储所有交易数据
    const transactions: any[] = [];
    const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    let dateRange: string[] = [];
    let foundDataStart = false;

  // 解析JSON、提取交易记录
  for (const jsonString of input) {
    try {
      const parsed = JSON.parse(jsonString);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        // 获取所有键名，包括可能包含BOM字符的键
        const keys = Object.keys(item);
        const meituanKey = keys.find(key => key.includes('美团交易账单明细'));

        // 首先检查是否找到【美团交易账单明细列表】标识
        if (meituanKey && item[meituanKey] && item[meituanKey].includes('【美团交易账单明细列表】')) {
          foundDataStart = true;
          continue;
        }

        // 提取日期范围信息
        if (meituanKey && item[meituanKey] && item[meituanKey].includes('起始时间：') && item[meituanKey].includes('终止时间：')) {
          const content = item[meituanKey];
          const dateMatch = content.match(/起始时间：\[([^\]]+)\]\s+终止时间：\[([^\]]+)\]/);
          if (dateMatch) {
            dateRange = [dateMatch[1] + ' 00:00:00', dateMatch[2] + ' 23:59:59'];
          }
          continue;
        }

        // 查找包含交易数据的对象 - 同时有美团交易账单明细和null字段，且已找到数据开始标识
        if (
          foundDataStart &&
          meituanKey &&
          item[meituanKey] &&
          item.null &&
          Array.isArray(item.null) &&
          item.null.length >= 10
        ) {
          const content = item[meituanKey];
          const transactionData = item.null;

          // 跳过标题行
          if (content === '交易创建时间') {
            continue;
          }

          // 检查是否包含有效的交易时间
          const hasValidCreateTime = timePattern.test(content);
          const hasValidSuccessTime = timePattern.test(transactionData[0]);

          if (hasValidCreateTime && hasValidSuccessTime) {
            // 获取交易类型
            const transactionType = transactionData[1].replace(/\\t/g, '').trim();
            
            // 只处理退款类型的交易
            if (transactionType === '退款') {
              // 创建交易记录
              const transaction = {
                交易创建时间: content.replace(/\\t/g, '').trim(),
                交易成功时间: transactionData[0].replace(/\\t/g, '').trim(),
                交易类型: transactionType,
                订单标题: transactionData[2].replace(/\\t/g, '').trim(),
                '收/支': transactionData[3].replace(/\\t/g, '').trim(),
                支付方式: transactionData[4].replace(/\\t/g, '').trim(),
                订单金额: transactionData[5].replace(/\\t/g, '').trim(),
                实付金额: transactionData[6].replace(/\\t/g, '').trim(),
                交易单号: transactionData[7].replace(/\\t/g, '').trim(),
                商家单号: transactionData[8].replace(/\\t/g, '').trim(),
                备注: (transactionData[9] || '/').replace(/\\t/g, '').trim(),
                channel: transactionData[4].replace(/\\t/g, '').trim(),
                type: transactionType,
                date: parseDateToTimestamp(content.replace(/\\t/g, '').trim()),
                amount: parseAmount(transactionData[6].replace(/\\t/g, '').trim()),
                id: transactionData[7].replace(/\\t/g, '').trim(),
              };

              transactions.push(transaction);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON string:', jsonString);
    }
  }

    // 根据id去重
    const uniqueTransactions = deduplicateById(transactions);
    
    // 根据date排序（降序，最新的在前）
    const sortedTransactions = sortByDateDesc(uniqueTransactions);
    
    return { 
      output: sortedTransactions
    };
  } catch (error) {
    console.error('Error in meituan_filelist_process.ts main function:', error);
    return { 
      output: []
    };
  }
}

export default main;


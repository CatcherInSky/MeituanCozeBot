// 入参类型 MeituanOrder[]
// 出参类型 string
// 作用：将美团订单数据转换为markdown表格

import { MeituanOrder, FunctionArgs, FunctionOutput } from '../../types';
import dayjs from 'dayjs';

type Args = FunctionArgs<{ input: MeituanOrder[] }>;
type Output = FunctionOutput<string>;

/**
 * 将秒级时间戳转换为日期字符串
 * @param timestamp 秒级时间戳
 * @returns YYYY-MM-DD HH:mm:ss 格式的日期字符串
 */
function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 获取美团订单的显示字段（排除英文key）
 * @param data 美团订单数据
 * @returns 过滤后的字段对象
 */
function getDisplayFields(data: MeituanOrder): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // 排除英文key（用于数据处理的字段）
    if (key.match(/^[a-zA-Z]+$/)) {
      continue;
    }
    
    // 美团订单的date字段需要特殊处理
    if (key === 'date' && typeof value === 'number') {
      result[key] = formatTimestamp(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 根据支付方式分组数据
 * @param data 美团订单数据
 * @returns 按支付方式分组的数据
 */
function groupByPaymentMethod(data: MeituanOrder[]): Record<string, MeituanOrder[]> {
  const groups: Record<string, MeituanOrder[]> = {};
  
  for (const item of data) {
    const paymentMethod = (item as any).支付方式 || '未知支付方式';
    if (!groups[paymentMethod]) {
      groups[paymentMethod] = [];
    }
    groups[paymentMethod].push(item);
  }
  
  return groups;
}

/**
 * 按交易成功时间排序
 * @param data 美团订单数据
 * @returns 排序后的数据
 */
function sortBySuccessTime(data: MeituanOrder[]): MeituanOrder[] {
  return data.sort((a, b) => {
    const timeA = (a as any).交易成功时间 || '';
    const timeB = (b as any).交易成功时间 || '';
    return timeB.localeCompare(timeA);
  });
}

/**
 * 生成单个支付方式的markdown表格
 * @param paymentMethod 支付方式
 * @param data 支付方式数据
 * @returns markdown表格字符串
 */
function generateMeituanTable(paymentMethod: string, data: MeituanOrder[]): string {
  if (!data || data.length === 0) {
    return `### ${paymentMethod}\n\n暂无数据\n\n`;
  }

  // 获取列名（使用第一个数据项作为样本）
  const displayFields = getDisplayFields(data[0]);
  const columns = Object.keys(displayFields);
  
  // 生成表头
  const header = `| ${columns.join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  
  // 生成数据行
  const rows = data.map(item => {
    const displayFields = getDisplayFields(item);
    const values = columns.map(col => {
      const value = displayFields[col];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    return `| ${values.join(' | ')} |`;
  });
  
  return `### ${paymentMethod}\n\n${header}\n${separator}\n${rows.join('\n')}\n\n`;
}

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;
    let markdown = '';
    
    if (!Array.isArray(input) || input.length === 0) {
      return { output: '没有美团订单数据' };
    }
    
    // 按支付方式分组
    const grouped = groupByPaymentMethod(input);
    const paymentMethods = Object.keys(grouped).sort();
    
    // 遍历所有支付方式
    for (const paymentMethod of paymentMethods) {
      const sorted = sortBySuccessTime(grouped[paymentMethod]);
      markdown += generateMeituanTable(paymentMethod, sorted);
    }
    
    return { output: markdown };
  } catch (error) {
    console.error('Error in meituan_markdown.ts main function:', error);
    return { output: '生成美团订单表格时发生错误' };
  }
}

export default main;

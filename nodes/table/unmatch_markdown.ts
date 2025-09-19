// 入参类型 MeituanOrder[]
// 出参类型 string
// 跟uncover_markdown生成表格逻辑类似

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
 * 获取换行符
 * @param newlineType 换行符类型
 * @returns 换行符
 */
function getNewlineChar(newlineType: string = 'natural'): string {
  switch (newlineType) {
    case 'natural':
      return '\n';
    case 'unicode':
      return '\u000A';
    case 'unicode2':
      return '\u2028';
    case 'unicode3':
      return '\u2029';
    case 'crlf':
      return '\r\n';
    case 'lf':
      return '\n';
    case 'cr':
      return '\r';
    default:
      return '\n';
  }
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
    if (!groups[paymentMethod]) groups[paymentMethod] = [];
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
 * 生成 unmatch 的 markdown 字符串
 * 跟uncover_markdown生成表格逻辑类似
 */
function generateUnmatchMarkdown(data: MeituanOrder[]): string {
  const newlineType = 'unicode';
  const newlineChar = getNewlineChar(newlineType);

  if (!Array.isArray(data) || data.length === 0) {
    return `${newlineChar}${newlineChar}没有未匹配交易记录`;
  }

  // 分组并排序
  const grouped = groupByPaymentMethod(data);
  const paymentMethods = Object.keys(grouped).sort();

  // 生成统一的表头
  const columnOrder = [
    '支付方式',
    '交易成功时间',
    '交易创建时间',
    '订单金额',
    '实付金额',
    '订单标题',
    '备注',
    '交易单号',
    '商家单号',
    '交易类型',
    '收/支',
  ];

  const header = `| ${columnOrder.join(' | ')} |`;
  const separator = `| ${columnOrder.map(() => '---').join(' | ')} |`;

  let markdown = `${newlineChar}${newlineChar}${header}${newlineChar}${separator}`;

  // 为每个支付方式生成数据行
  for (const method of paymentMethods) {
    const sorted = sortBySuccessTime(grouped[method]);
    
    // 添加支付方式分隔行（使用合并单元格的方式）
    const methodRow = `| **${method}** | ${' | '.repeat(columnOrder.length - 1)} |`;
    markdown += `${newlineChar}${methodRow}`;
    
    // 添加该支付方式下的所有交易记录
    for (const item of sorted) {
      const displayFields = getDisplayFields(item);
      const values = columnOrder.map(key => {
        const value = displayFields[key];
        if (value === null || value === undefined) return '';
        return String(value);
      });
      const row = `| ${values.join(' | ')} |`;
      markdown += `${newlineChar}${row}`;
    }
  }

  return markdown;
}

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;
    const markdown = generateUnmatchMarkdown(input);
    return { output: markdown };
  } catch (error) {
    console.error('Error in unmatch_markdown.ts main function:', error);
    return { output: '生成未匹配表格时发生错误' };
  }
}

export default main;
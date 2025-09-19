// 入参类型 MatchResult
// 出参类型，根据美团的channel划分表格，逻辑类似channel_markdown

import { MeituanOrder, PaymentData, FunctionArgs, FunctionOutput } from '../../types';
import dayjs from 'dayjs';

type MatchResult = (MeituanOrder & PaymentData)[];
type Args = FunctionArgs<{ input: MatchResult }>;
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
 * 获取匹配结果的显示字段（排除英文key）
 * @param data 匹配结果数据
 * @returns 过滤后的字段对象
 */
function getDisplayFields(data: MeituanOrder & PaymentData): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // 排除英文key（用于数据处理的字段）
    if (key.match(/^[a-zA-Z]+$/)) {
      continue;
    }
    
    // 美团余额的date字段需要特殊处理
    if (key === 'date' && data.channel === '美团余额' && typeof value === 'number') {
      result[key] = formatTimestamp(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 根据美团渠道分组数据
 * @param data 匹配结果数据
 * @returns 按渠道分组的数据
 */
function groupByMeituanChannel(data: MatchResult): Record<string, MatchResult> {
  const groups: Record<string, MatchResult> = {};
  
  for (const item of data) {
    const channel = item.channel || '未知渠道';
    if (!groups[channel]) {
      groups[channel] = [];
    }
    groups[channel].push(item);
  }
  
  return groups;
}

/**
 * 生成单个渠道的markdown表格
 * @param channel 渠道名称
 * @param data 渠道数据
 * @returns markdown表格字符串
 */
function generateMatchTable(channel: string, data: MatchResult): string {
  if (!data || data.length === 0) {
    return `### ${channel}\n\n暂无匹配数据\n\n`;
  }

  // 获取所有字段并分类
  const { meituanColumns, otherColumns, allColumns } = categorizeColumns(data);
  
  // 生成表头：美团字段 + 其他渠道字段
  const processedColumns = [
    ...meituanColumns.map(col => `美团-${col}`),
    ...otherColumns
  ];
  
  // 生成表头
  const header = `| ${processedColumns.join(' | ')} |`;
  const separator = `| ${processedColumns.map(() => '---').join(' | ')} |`;
  
  // 生成数据行
  const rows = data.map(item => {
    const displayFields = getDisplayFields(item);
    const values = allColumns.map(col => {
      const value = displayFields[col];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    return `| ${values.join(' | ')} |`;
  });
  
  return `### ${channel}\n\n${header}\n${separator}\n${rows.join('\n')}\n\n`;
}

/**
 * 对字段进行分类：美团字段和其他渠道字段
 * @param data 匹配结果数据
 * @returns 分类后的字段列表
 */
function categorizeColumns(data: MatchResult): { 
  meituanColumns: string[]; 
  otherColumns: string[]; 
  allColumns: string[] 
} {
  // 美团特有字段
  const meituanSpecificFields = [
    '订单标题', '实付金额', '备注', '交易创建时间', '交易成功时间', 
    '交易时间', '交易类型', '收/支', '订单金额', '交易单号', '商家单号', '支付方式'
  ];
  
  // 获取所有字段
  const allFields = new Set<string>();
  for (const item of data) {
    const displayFields = getDisplayFields(item);
    Object.keys(displayFields).forEach(key => allFields.add(key));
  }
  
  const meituanColumns: string[] = [];
  const otherColumns: string[] = [];
  
  for (const field of allFields) {
    if (meituanSpecificFields.includes(field)) {
      meituanColumns.push(field);
    } else {
      otherColumns.push(field);
    }
  }
  
  // 按原始顺序排列所有字段
  const allColumns = [...meituanColumns, ...otherColumns];
  
  return { meituanColumns, otherColumns, allColumns };
}

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;
    let markdown = '';
    
    // 按美团渠道分组
    const grouped = groupByMeituanChannel(input);
    
    // 遍历所有渠道
    for (const [channel, data] of Object.entries(grouped)) {
      markdown += generateMatchTable(channel, data);
    }
    
    return { output: markdown || '没有匹配数据' };
  } catch (error) {
    console.error('Error in match_markdown.ts main function:', error);
    return { output: '生成匹配表格时发生错误' };
  }
}

export default main;
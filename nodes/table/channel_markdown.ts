// 入参类型 DataOutput
// 出参类型 string
// 每个PaymentChannel生成一个表格，表头则根据该PaymentChannel的key生成类似下面
// ### ${PaymentChannel}
// |--|--|--|
// | 交易时间 | 交易金额 | 交易类型 |
// |--|--|--|
// | 2025-01-01 | 100 | 收入 |
// | 2025-01-02 | 200 | 支出 |
// | 2025-01-03 | 300 | 收入 |
// ### ${PaymentChannel}
// |--|--|--|
// | 2025-01-04 | 400 | 支出 |
// | 2025-01-05 | 500 | 收入 |

import { DataOutput, PaymentData, FunctionArgs, FunctionOutput } from '../../types';
import dayjs from 'dayjs';

type Args = FunctionArgs<{ input: DataOutput }>;
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
 * 获取支付数据的显示字段（排除英文key）
 * @param data 支付数据
 * @returns 过滤后的字段对象
 */
function getDisplayFields(data: PaymentData): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // 排除英文key（用于数据处理的字段）
    if (key.match(/^[a-zA-Z]+$/)) {
      continue;
    }
    
    // 美团余额的date字段需要特殊处理
    if (key === 'date' && (data as any).channel === '美团余额' && typeof value === 'number') {
      result[key] = formatTimestamp(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 根据渠道类型生成表格列
 * @param channel 渠道名称
 * @param sampleData 样本数据
 * @returns 列名数组
 */
function getColumnsForChannel(channel: string, sampleData: PaymentData): string[] {
  const displayFields = getDisplayFields(sampleData);
  return Object.keys(displayFields);
}

/**
 * 生成单个渠道的markdown表格
 * @param channel 渠道名称
 * @param data 渠道数据
 * @returns markdown表格字符串
 */
function generateChannelTable(channel: string, data: PaymentData[]): string {
  if (!data || data.length === 0) {
    return `### ${channel}\n\n暂无数据\n\n`;
  }

  // 获取列名
  const columns = getColumnsForChannel(channel, data[0]);
  
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
  
  return `### ${channel}\n\n${header}\n${separator}\n${rows.join('\n')}\n\n`;
}

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;
    let markdown = '';
    
    // 遍历所有渠道
    for (const [channel, data] of Object.entries(input)) {
      if (Array.isArray(data) && data.length > 0) {
        markdown += generateChannelTable(channel, data as PaymentData[]);
      }
    }
    
    return { output: markdown };
  } catch (error) {
    console.error('Error in channel_markdown.ts main function:', error);
    return { output: '生成渠道表格时发生错误' };
  }
}

export default main;
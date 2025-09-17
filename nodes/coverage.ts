import { MeituanOrder, DateList, FunctionArgs, FunctionOutput } from '../types';

/**
 * 将美团订单数据按照覆盖逻辑分为两组
 * @param dateList 日期列表，包含渠道和起止日期
 * @param meituanOrders 美团订单数据列表
 * @returns 包含未被覆盖和已被覆盖的美团订单列表
 */
type Args = FunctionArgs<{ dateList: DateList; meituanOrders: MeituanOrder[] }>;
type Output = FunctionOutput<{ uncover: MeituanOrder[]; cover: MeituanOrder[]; markdown: string }>;

async function main({ params }: Args): Promise<Output> {
  const { dateList, meituanOrders } = params;
  const uncover: MeituanOrder[] = [];
  const cover: MeituanOrder[] = [];

  for (const order of meituanOrders) {
    let isCovered = false;

    // 检查当前订单是否被DateList中的任何条目覆盖
    for (const dateItem of dateList) {
      // 检查渠道是否匹配
      if (order.channel.includes(dateItem.channel)) {
        // 解析日期范围
        const [startDateStr, endDateStr] = dateItem.date;
        
        // 如果没有时分秒数据，添加默认时间
        const startDate = addDefaultTime(startDateStr, '00:00:00');
        const endDate = addDefaultTime(endDateStr, '23:59:59');
        
        // 将日期字符串转换为时间戳（秒）进行比较
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        
        // 检查订单时间是否在日期范围内（order.date 为秒级时间戳）
        if (order.date >= startTimestamp && order.date <= endTimestamp) {
          isCovered = true;
          break;
        }
      }
    }

    // 根据覆盖状态分类
    if (isCovered) {
      cover.push(order);
    } else {
      uncover.push(order);
    }
  }

  // 基于 uncover 生成 markdown 字符串（与 uncover_markdown_generator 逻辑一致）
  const markdown = generateUncoverMarkdown(uncover);

  return { output: { uncover, cover, markdown } };
}

/**
 * 为日期字符串添加默认时间
 * @param dateStr 日期字符串
 * @param defaultTime 默认时间
 * @returns 完整的日期时间字符串
 */
function addDefaultTime(dateStr: string, defaultTime: string): string {
  // 如果日期字符串已经包含时间，直接返回
  if (dateStr.includes(' ')) {
    return dateStr;
  }
  
  // 如果只有日期，添加默认时间
  return `${dateStr} ${defaultTime}`;
}

export default main;

/**
 * 生成 uncover 的 markdown 字符串
 * 参考 script/markdown/uncover_markdown_generator.ts 的分组、排序与表格生成逻辑
 */
function generateUncoverMarkdown(data: MeituanOrder[]): string {
  const newlineType = 'unicode';
  const newlineChar = getNewlineChar(newlineType);

  if (!Array.isArray(data) || data.length === 0) {
    return `# 时间或支付方式未覆盖退款数据详情${newlineChar}${newlineChar}没有未覆盖退款数据`;
  }

  // 分组并排序
  const grouped = groupByPaymentMethod(data);
  const paymentMethods = Object.keys(grouped).sort();

  let markdown = `# 时间或支付方式未覆盖退款数据详情${newlineChar}${newlineChar}`;

  for (const method of paymentMethods) {
    const sorted = sortBySuccessTime(grouped[method]);
    const table = generateMeituanTable(sorted, newlineType);
    markdown += `## ${method}${newlineChar}${newlineChar}${table}${newlineChar}${newlineChar}`;
  }

  return markdown;
}

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

function groupByPaymentMethod(data: MeituanOrder[]): Record<string, MeituanOrder[]> {
  const groups: Record<string, MeituanOrder[]> = {};
  for (const item of data) {
    const paymentMethod = (item as any).支付方式 || '未知支付方式';
    if (!groups[paymentMethod]) groups[paymentMethod] = [];
    groups[paymentMethod].push(item);
  }
  return groups;
}

function sortBySuccessTime(data: MeituanOrder[]): MeituanOrder[] {
  return data.sort((a, b) => {
    const timeA = (a as any).交易成功时间 || '';
    const timeB = (b as any).交易成功时间 || '';
    return timeB.localeCompare(timeA);
  });
}

function generateMeituanTable(data: MeituanOrder[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

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

  const rows = data.map(item => {
    const values = columnOrder.map(key => {
      const value = (item as any)[key];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    return `| ${values.join(' | ')} |`;
  });

  const newlineChar = getNewlineChar(newlineType);
  const lines = [header, separator, ...rows];
  return lines.join(newlineChar);
}

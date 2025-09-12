// 根据final.ts的uncover输出，生成markdown组件使用的字符串
import { 
  // MeituanOrder,
   MarkdownGeneratorInput, MarkdownGeneratorOutput } from '../../types';

type Args = MarkdownGeneratorInput;
type Output = MarkdownGeneratorOutput;
interface MeituanOrder {
  支付方式: string;
  实付金额: string;
  备注: string;
  订单标题: string;
  交易创建时间: string;
  交易成功时间: string;
  交易类型: string;
  '收/支': string;
  订单金额: string;
  交易单号: string;
  商家单号: string;
}
/**
 * 根据换行类型获取换行符
 * @param newlineType 换行类型
 * @returns 对应的换行符
 */
function getNewlineChar(newlineType: string = 'natural'): string {
  switch (newlineType) {
    case 'natural':
      return '\n'; // 真正的换行符
    case 'unicode':
      return '\u000A'; // Unicode换行符
    case 'unicode2':
      return '\u2028'; // Unicode行分隔符
    case 'unicode3':
      return '\u2029'; // Unicode段落分隔符
    case 'crlf':
      return '\r\n'; // Windows换行符
    case 'lf':
      return '\n'; // Unix换行符
    case 'cr':
      return '\r'; // Mac换行符
    default:
      return '\n';
  }
}

/**
 * 将美团订单数组转换为markdown表格
 * @param data 美团订单数组
 * @param newlineType 换行类型
 * @returns markdown表格字符串
 */
function generateMeituanTable(data: MeituanOrder[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

  // 定义列的顺序
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

  // 生成表头
  const header = `| ${columnOrder.join(' | ')} |`;

  // 生成分隔线
  const separator = `| ${columnOrder.map(() => '---').join(' | ')} |`;

  // 生成数据行
  const rows = data.map(item => {
    const values = columnOrder.map(key => {
      const value = (item as any)[key];
      // 处理null、undefined和空值
      if (value === null || value === undefined) {
        return '';
      }
      const processedValue = String(value);
      return processedValue;
    });
    return `| ${values.join(' | ')} |`;
  });

  // 使用指定类型的换行符
  const newlineChar = getNewlineChar(newlineType);
  const lines = [header, separator, ...rows];
  return lines.join(newlineChar);
}

/**
 * 根据支付方式分组美团订单数据
 * @param data 美团订单数组
 * @returns 按支付方式分组的数据
 */
function groupByPaymentMethod(data: MeituanOrder[]): Record<string, MeituanOrder[]> {
  const groups: Record<string, MeituanOrder[]> = {};

  data.forEach(item => {
    const paymentMethod = item.支付方式 || '未知支付方式';
    if (!groups[paymentMethod]) {
      groups[paymentMethod] = [];
    }
    groups[paymentMethod].push(item);
  });

  return groups;
}

/**
 * 按交易成功时间降序排序美团订单
 * @param data 美团订单数组
 * @returns 排序后的数据
 */
function sortBySuccessTime(data: MeituanOrder[]): MeituanOrder[] {
  return data.sort((a, b) => {
    const timeA = a.交易成功时间 || '';
    const timeB = b.交易成功时间 || '';
    return timeB.localeCompare(timeA); // 降序
  });
}

async function main({ params }: Args): Promise<Output> {
  const { input } = params;
  const newlineType = 'unicode';
  const newlineChar = getNewlineChar(newlineType);

  try {
    // 验证输入数据
    if (!Array.isArray(input)) {
      return {
        output: `# 时间或支付方式未覆盖退款数据详情${newlineChar}${newlineChar}错误：输入数据必须是数组格式`,
      };
    }

    // 过滤掉无效数据 - 确保是MeituanOrder格式
    const validData = input.filter(
      item =>
        item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length > 0
    ) as MeituanOrder[];

    if (validData.length === 0) {
      return {
        output: `# 时间或支付方式未覆盖退款数据详情${newlineChar}${newlineChar}没有未覆盖退款数据`,
      };
    }

    // 按支付方式分组
    const groupedData = groupByPaymentMethod(validData);

    // 生成主标题
    let markdown = `# 时间或支付方式未覆盖退款数据详情${newlineChar}${newlineChar}`;

    // 为每个支付方式生成表格
    const paymentMethods = Object.keys(groupedData).sort(); // 按支付方式名称排序

    for (const paymentMethod of paymentMethods) {
      const data = groupedData[paymentMethod];
      // 按交易成功时间降序排序
      const sortedData = sortBySuccessTime(data);

      // 生成表格
      const table = generateMeituanTable(sortedData, newlineType);

      // 添加支付方式标题和表格
      markdown += `## ${paymentMethod}${newlineChar}${newlineChar}${table}${newlineChar}${newlineChar}`;
    }

    return {
      output: markdown,
    };
  } catch (error) {
    return {
      output: `错误：${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

export default main;

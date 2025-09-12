// 根据文件处理的输出，生成markdown组件使用的字符串
import { MeituanOrder, MarkdownGeneratorInput, MarkdownGeneratorOutput } from '../../types';

// Demo数据已移至测试用例中

type Args = MarkdownGeneratorInput;
type Output = MarkdownGeneratorOutput;

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
 * 将对象数组转换为markdown表格
 * @param data 对象数组
 * @param newlineType 换行类型
 * @returns markdown表格字符串
 */
function generateMarkdownTable(data: Object[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

  // 定义列的顺序
  const columnOrder = [
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
    '支付方式',
  ];

  // 生成表头
  const header = `| ${columnOrder.join(' | ')} |`;

  // 生成分隔线
  const separator = `| ${columnOrder.map(() => '---').join(' | ')} |`;

  // 生成数据行
  const rows = data.map(item => {
    const values = columnOrder.map(key => {
      const value = item[key as keyof typeof item];
      // 处理null、undefined和空值
      if (value === null || value === undefined) {
        return '';
      }
      const processedValue = String(value);
      return processedValue;
    });
    return `| ${values.join(' | ')} |`;
  });

  // 使用指定类型的换行符，避免\n字符
  const newlineChar = getNewlineChar(newlineType);
  const lines = [header, separator, ...rows];
  return lines.join(newlineChar);
}

/**
 * 根据支付方式分组数据
 * @param data 对象数组
 * @returns 按支付方式分组的数据
 */
function groupByPaymentMethod(data: Object[]): Record<string, Object[]> {
  const groups: Record<string, Object[]> = {};

  data.forEach(item => {
    const paymentMethod = String(item['支付方式' as keyof typeof item] || '未知支付方式');
    if (!groups[paymentMethod]) {
      groups[paymentMethod] = [];
    }
    groups[paymentMethod].push(item);
  });

  return groups;
}

/**
 * 按交易成功时间降序排序
 * @param data 对象数组
 * @returns 排序后的数据
 */
function sortBySuccessTime(data: Object[]): Object[] {
  return data.sort((a, b) => {
    const timeA = String(a['交易成功时间' as keyof typeof a] || '');
    const timeB = String(b['交易成功时间' as keyof typeof b] || '');
    return timeB.localeCompare(timeA); // 降序
  });
}

async function main({ params }: Args): Promise<Output> {
  const { input } = params;
  const newlineType = 'unicode';

  try {
    // 验证输入数据
    if (!Array.isArray(input)) {
      return {
        output: '错误：输入数据必须是数组格式',
      };
    }

    // 过滤掉无效数据
    const validData = input.filter(
      item =>
        item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length > 0
    );

    if (validData.length === 0) {
      return {
        output: '错误：没有找到有效的对象数据',
      };
    }

    // 按支付方式分组
    const groupedData = groupByPaymentMethod(validData);
    const newlineChar = getNewlineChar(newlineType);

    // 生成主标题
    let markdown = `# 无法匹配订单数据详情${newlineChar}${newlineChar}`;

    // 为每个支付方式生成表格
    const paymentMethods = Object.keys(groupedData).sort(); // 按支付方式名称排序

    for (const paymentMethod of paymentMethods) {
      const data = groupedData[paymentMethod];
      // 按交易成功时间降序排序
      const sortedData = sortBySuccessTime(data);

      // 生成表格
      const table = generateMarkdownTable(sortedData, newlineType);

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

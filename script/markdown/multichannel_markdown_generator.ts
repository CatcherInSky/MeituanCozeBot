// 根据final.ts的multichannel输出，生成markdown组件使用的字符串
import { 
  PaymentData, 
  MarkdownGeneratorInput, 
  MarkdownGeneratorOutput 
} from '../../types';

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
 * 获取支付数据的时间字段用于排序
 * @param data 支付数据
 * @returns 时间字符串
 */
function getPaymentTimeForSort(data: PaymentData): string {
  if ('交易时间' in data) {
    return data.交易时间;
  }
  if ('记账日期' in data) {
    return data.记账日期;
  }
  return '';
}

/**
 * 根据数据来源分组数据
 * @param data 支付数据数组
 * @returns 按数据来源分组的数据
 */
function groupByDataSource(data: PaymentData[]): Record<string, PaymentData[]> {
  const groups: Record<string, PaymentData[]> = {};

  data.forEach(item => {
    const dataSource = item.数据来源 || '未知数据来源';
    if (!groups[dataSource]) {
      groups[dataSource] = [];
    }
    groups[dataSource].push(item);
  });

  return groups;
}

/**
 * 按时间降序排序支付数据
 * @param data 支付数据数组
 * @returns 排序后的数据
 */
function sortByTime(data: PaymentData[]): PaymentData[] {
  return data.sort((a, b) => {
    const timeA = getPaymentTimeForSort(a);
    const timeB = getPaymentTimeForSort(b);
    return timeB.localeCompare(timeA); // 降序
  });
}

/**
 * 生成支付数据的markdown表格
 * @param data 支付数据数组
 * @param newlineType 换行类型
 * @returns markdown表格字符串
 */
function generatePaymentDataTable(data: PaymentData[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

  // 定义列的顺序 - 根据不同的支付类型动态生成
  const getColumnOrder = (item: PaymentData): string[] => {
    if ('交易时间' in item) {
      // 微信支付和支付宝
      return [
        '交易时间',
        '金额(元)',
        '支付方式',
        '商户单号',
        '备注',
        '当前状态',
        '交易类型',
        '交易对方',
        '商品',
        '收/支',
        '交易单号',
        '数据来源',
      ];
    } else {
      // 招商银行储蓄卡和信用卡
      return [
        '记账日期',
        '货币',
        '交易金额',
        '联机余额',
        '交易摘要',
        '对手信息',
        '数据来源',
      ];
    }
  };

  // 使用第一个数据项来确定列顺序
  const columnOrder = getColumnOrder(data[0]);

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
    ) as PaymentData[];

    if (validData.length === 0) {
      return {
        output: '错误：没有找到有效的支付数据',
      };
    }

    // 按数据来源分组
    const groupedData = groupByDataSource(validData);
    const newlineChar = getNewlineChar(newlineType);

    // 生成主标题
    let markdown = `# 多渠道支付数据详情${newlineChar}${newlineChar}`;

    // 为每个数据来源生成表格
    const dataSources = Object.keys(groupedData).sort(); // 按数据来源名称排序

    for (const dataSource of dataSources) {
      const data = groupedData[dataSource];
      // 按时间降序排序
      const sortedData = sortByTime(data);

      // 生成表格
      const table = generatePaymentDataTable(sortedData, newlineType);

      // 添加数据来源标题和表格
      markdown += `## ${dataSource}${newlineChar}${newlineChar}${table}${newlineChar}${newlineChar}`;
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

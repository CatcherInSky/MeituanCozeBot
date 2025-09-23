// 广发银行信用卡demo数据处理，由单个PDF解析出起止日期，还有每条交易流水详情
import { GfCreditCardPayment, ChannelProcessOutput, FunctionArgs } from '../../types';
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
  
  // 去除货币符号（￥、$、€等）、空格和千位分隔符逗号
  let cleaned = amountStr.replace(/[￥$€£¥\s,]/g, '');
  
  // 转换为数字
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? 0 : amount;
}

/**
 * 从交易摘要中提取交易类型
 * @param summary 交易摘要
 * @returns 交易类型
 */
function extractTransactionType(summary: string): string {
  if (!summary) return '';
  
  // 提取括号中的类型，如 "(消费)" -> "消费"
  const match = summary.match(/\(([^)]+)\)/);
  return match ? match[1] : summary;
}

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<GfCreditCardPayment>;

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;

    // 清理输入数据，但保留换行符以便处理跨行数据
    const cleanedInput = input
      .replace(/\n+/g, '\n') // 将多个换行符合并为单个换行符
      .replace(/[ \t]+/g, ' ') // 将多个空格/制表符合并为单个空格
      .trim();

  const transactions: GfCreditCardPayment[] = [];
  let dateRange: string[] = [];

  // 查找账单周期：账单周期YYYY/MM/DD - YYYY/MM/DD
  const billCycleMatch = cleanedInput.match(/账单周期(\d{4}\/\d{2}\/\d{2})\s*-\s*(\d{4}\/\d{2}\/\d{2})/);
  
  if (billCycleMatch) {
    // 转换日期格式为标准格式 YYYY-MM-DD HH:mm:ss
    const startDate = billCycleMatch[1].replace(/\//g, '-') + ' 00:00:00';
    const endDate = billCycleMatch[2].replace(/\//g, '-') + ' 23:59:59';
    dateRange = [startDate, endDate];
  }

  // 查找数据解析范围：处理多页数据
  const startMarker = '交易日期入账日期交易摘要交易金额交易货币入账金额入账货币';
  const endMarker = '用卡安全温馨提示：';
  
  const startIndex = cleanedInput.indexOf(startMarker);
  if (startIndex === -1) {
    console.warn('Could not find data start marker in GF credit card statement');
    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 找到最后一个结束标记，以支持多页数据
  let lastEndIndex = cleanedInput.lastIndexOf(endMarker);
  if (lastEndIndex === -1 || lastEndIndex <= startIndex) {
    // 如果没有找到结束标记，使用整个文档
    lastEndIndex = cleanedInput.length;
    console.warn('Could not find end marker, processing entire document');
  }

  // 提取交易数据区域（从第一个开始标记到最后一个结束标记）
  const dataSection = cleanedInput.substring(startIndex, lastEndIndex);
  
  // 按行分割数据
  const lines = dataSection.split('\n').filter(line => line.trim());
  
  // 查找所有表头位置：交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
  const headerIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易日期') && lines[i].includes('入账日期') && 
        lines[i].includes('交易摘要') && lines[i].includes('交易金额')) {
      headerIndices.push(i);
    }
  }
  
  // 如果没找到表头，尝试更宽松的查找条件
  if (headerIndices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('交易日期') && lines[i].includes('交易金额')) {
        headerIndices.push(i);
      }
    }
  }
  
  // 查找分页标识位置，用于调试和验证
  const pageIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d+\/\d+$/)) { // 匹配 "1/3", "2/3", "3/3" 等格式
      pageIndices.push(i);
    }
  }
  
  // 输出分页信息用于调试
  if (pageIndices.length > 0) {
    console.log(`Found ${pageIndices.length} page markers, processing multi-page document`);
  }
  
  // 如果没找到表头，尝试查找卡号行作为数据开始位置
  if (headerIndices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('卡号：')) {
        headerIndices.push(i);
        break;
      }
    }
  }

  if (headerIndices.length === 0) {
    console.warn('Could not find header in GF credit card data');
    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 解析交易数据 - 改进的逐行扫描方式
  // 广发银行数据格式：每个交易记录包含日期行，后续是摘要和金额行（可能跨多行）
  
  // 处理每个表头区域的数据
  for (let headerIdx = 0; headerIdx < headerIndices.length; headerIdx++) {
    const headerIndex = headerIndices[headerIdx];
    
    // 计算当前表头区域的结束位置
    let endIndex: number;
    
    if (headerIdx < headerIndices.length - 1) {
      // 不是最后一个表头，结束位置是下一个表头
      endIndex = headerIndices[headerIdx + 1];
    } else {
      // 最后一个表头，结束位置是数据结束
      endIndex = lines.length;
    }
    
    // 第一个表头区域需要特殊处理，跳过标题行
    let startLine = headerIndex + 1;
    if (headerIdx === 0) {
      // 跳过第一个表头区域的标题行
      while (startLine < endIndex && 
             (lines[startLine].includes('交易明细') || 
              lines[startLine].includes('卡号：'))) {
        startLine++;
      }
    }
    
    // 逐行扫描，寻找日期行作为交易记录的开始
    for (let i = startLine; i < endIndex; i++) {
      try {
        const currentLine = lines[i]?.trim() || '';
        
        // 跳过空行和非交易数据行
        if (!currentLine || 
            currentLine.includes('卡号：') || currentLine.includes('交易明细') ||
            currentLine.match(/^\d+\/\d+$/)) {
          continue;
        }

        // 检查是否是日期行
        const dateMatch = currentLine.match(/^(\d{4}\/\d{2}\/\d{2})(\d{4}\/\d{2}\/\d{2})/);
        if (!dateMatch) continue;
        
        const transactionDate = dateMatch[1];
        const postingDate = dateMatch[2];
        
        // 从下一行开始收集摘要和金额信息
        let summaryParts: string[] = [];
        let amountLine = '';
        let j = i + 1;
        
        // 收集后续行直到找到金额行或下一个日期行
        while (j < endIndex) {
          const nextLine = lines[j]?.trim() || '';
          
          // 如果遇到下一个日期行，停止收集
          if (nextLine.match(/^(\d{4}\/\d{2}\/\d{2})(\d{4}\/\d{2}\/\d{2})/)) {
            break;
          }
          
          // 跳过分页标识和其他非内容行
          if (nextLine.match(/^\d+\/\d+$/) || 
              nextLine.includes('卡号：') || 
              nextLine.includes('交易明细') ||
              !nextLine) {
            j++;
            continue;
          }
          
            // 检查是否包含金额（人民币）
            if (nextLine.includes('人民币')) {
              // 检查是否是标准的金额行格式（支持千位分隔符逗号）
              const amountMatch = nextLine.match(/(-?[\d,]+\.?\d*)\s*人民币(-?[\d,]+\.?\d*)\s*人民币/);
            if (amountMatch) {
              amountLine = nextLine;
              break;
            } else {
              // 可能是摘要中包含"人民币"，继续收集
              summaryParts.push(nextLine);
            }
          } else {
            // 摘要行
            summaryParts.push(nextLine);
          }
          
          j++;
        }
        
        // 如果没有找到金额行，跳过这个交易
        if (!amountLine) {
          continue;
        }
        
        // 合并摘要部分
        const fullSummary = summaryParts.join(' ').trim();
        
        // 解析交易类型和摘要
        const typeMatch = fullSummary.match(/^\(([^)]+)\)(.+)/);
        if (!typeMatch) continue;
        
        const transactionType = typeMatch[1];
        const summary = typeMatch[2].trim();
        
        // 解析金额（支持千位分隔符逗号）
        const amountMatch = amountLine.match(/(-?[\d,]+\.?\d*)\s*人民币(-?[\d,]+\.?\d*)\s*人民币/);
        if (!amountMatch) continue;
        
        const transactionAmount = amountMatch[1];
        const postingAmount = amountMatch[2];
        
        const transaction: GfCreditCardPayment = {
          交易日期: transactionDate,
          入账日期: postingDate,
          交易摘要: `(${transactionType})${summary}`,
          类型: transactionType,
          交易金额: transactionAmount,
          交易货币: '人民币',
          入账金额: postingAmount,
          入账货币: '人民币',
          channel: '广发银行信用卡',
          type: transactionType,
          amount: parseAmount(postingAmount),
          date: parseDateToTimestamp(postingDate, dateRange as [string, string]),
          id: `${transactionDate}|${summary}|${transactionType}|${postingAmount}`,
        };

        transactions.push(transaction);
        
        // 跳转到金额行之后继续处理
        i = j;
        
      } catch (error) {
        console.warn('Error parsing GF credit card transaction:', error, lines[i]);
      }
    }
  }

    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: transactions,
      },
    };
  } catch (error) {
    console.error('Error in gf_creditcard_file_process.ts main function:', error);
    return {
      output: {
        channel: '广发银行信用卡',
        date: [],
        data: [],
      },
    };
  }
}

export default main;

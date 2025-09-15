// 招商银行储蓄卡demo数据处理，由单个pdf解析出起止日期，还有每条交易流水详情
import { CmbDebitCardPayment, ChannelProcessOutput, FunctionArgs } from '../../types';

// Demo数据已移至测试用例中
type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<CmbDebitCardPayment>;

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 清理输入数据，但保留换行符以便处理跨行数据
  const cleanedInput = input
    .replace(/\n+/g, '\n') // 将多个换行符合并为单个换行符
    .replace(/[ \t]+/g, ' ') // 将多个空格/制表符合并为单个空格
    .trim();

  const transactions: any[] = [];
  let dateRange: string[] = [];

  // 查找日期范围模式：YYYY-MM-DD -- YYYY-MM-DD
  const dateRangeMatch = cleanedInput.match(/(\d{4}-\d{2}-\d{2})\s*--\s*(\d{4}-\d{2}-\d{2})/);

  if (dateRangeMatch) {
    const startDate = dateRangeMatch[1];
    const endDate = dateRangeMatch[2];

    // 为只有日期的数据添加默认时间
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    dateRange = [startDateTime, endDateTime];
  }

  // 根据规则：从验证码(Verification Code)之后开始解析
  let dataStartIndex = -1;
  const lines = cleanedInput.split('\n');
  
  // 查找验证码标识，确定数据解析起点
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('验证码') || line.includes('Verification Code')) {
      dataStartIndex = i + 1; // 从验证码下一行开始
      break;
    }
  }

  // 如果没有找到验证码标识，使用原有逻辑作为备选
  if (dataStartIndex === -1) {
    dataStartIndex = 0;
  }

  // 根据规则优化：每行数据都是日期开始 YYYY-MM-DD
  // 货币列都是英文，紧跟着交易金额和联机余额都是小数点后两位的数字
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过表头行和空行
    if (
      !line ||
      line.includes('记账日期') ||
      line.includes('DateCurrency') ||
      line.includes('Transaction') ||
      line.includes('Amount') ||
      line.includes('Balance') ||
      line.includes('Transaction Type') ||
      line.includes('Counter Party') ||
      line.includes('招商银行') ||
      line.includes('Transaction Statement') ||
      line.includes('户名') ||
      line.includes('账户类型') ||
      line.includes('申请时间') ||
      line.includes('账号') ||
      line.includes('开户行') ||
      line.includes('验证码') ||
      line.includes('共') ||
      line.includes('收入') ||
      line.includes('支出') ||
      line.includes('中性交易') ||
      line.includes('注：') ||
      line.includes('1.') ||
      line.includes('2.') ||
      line.includes('3.') ||
      line.includes('----------------------') ||
      line.match(/^\d+\/\d+$/)
    ) {
      // 页码格式如 "1/16"
      continue;
    }

    // 检查是否以日期开始 (YYYY-MM-DD)
    const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const afterDate = line.substring(dateMatch[0].length);

    // 查找货币（英文，通常是3个字母）
    const currencyMatch = afterDate.match(/^([A-Z]{3})/);
    if (!currencyMatch) continue;

    const currency = currencyMatch[1];
    const afterCurrency = afterDate.substring(currencyMatch[0].length);

    // 查找交易金额（小数点后两位的数字，可能包含逗号和正负号）
    const amountMatch = afterCurrency.match(/^([+-]?[\d,]+\.\d{2})/);
    if (!amountMatch) continue;

    const amount = amountMatch[1];
    const afterAmount = afterCurrency.substring(amountMatch[0].length);

    // 查找联机余额（小数点后两位的数字，可能包含逗号）
    const balanceMatch = afterAmount.match(/^([\d,]+\.\d{2})/);
    if (!balanceMatch) continue;

    const balance = balanceMatch[1];
    const afterBalance = afterAmount.substring(balanceMatch[0].length);

    // 处理交易摘要和对手信息（可能跨行）
    let transactionSummary = afterBalance.trim();
    let counterparty = '';

    // 检查下一行是否包含对手信息（包含数字）
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      // 如果下一行包含数字且不是日期，可能是对手信息
      if (nextLine && !nextLine.match(/^\d{4}-\d{2}-\d{2}/) && nextLine.match(/\d/)) {
        transactionSummary += ' ' + nextLine;
        i++; // 跳过下一行，因为已经处理了
      }
    }

    // 尝试分离交易摘要和对手信息
    // 对手信息通常包含数字和英文，交易摘要是中文
    const summaryMatch = transactionSummary.match(/^([^\d]+?)(\d.*)?$/);

    if (summaryMatch) {
      const summary = summaryMatch[1].trim();
      const counterpartyInfo = summaryMatch[2] ? summaryMatch[2].trim() : '';

      // 进一步分离：对手信息通常以数字开头
      const counterpartyMatch = counterpartyInfo.match(/^(\d.*)$/);
      if (counterpartyMatch) {
        counterparty = counterpartyMatch[1];
      } else {
        // 如果无法分离，将包含数字的部分作为对手信息
        const parts = counterpartyInfo.split(/(\d)/);
        if (parts.length > 1) {
          const digitIndex = counterpartyInfo.search(/\d/);
          counterparty = counterpartyInfo.substring(digitIndex);
        }
      }

      transactionSummary = summary;
    }

    // 清理数据
    const cleanedTransaction = {
      记账日期: date,
      货币: currency,
      交易金额: amount.replace(/,/g, ''), // 移除金额中的逗号
      联机余额: balance.replace(/,/g, ''), // 移除余额中的逗号
      交易摘要: transactionSummary,
      对手信息: counterparty,
      数据来源: '招商银行储蓄卡',
    };

    transactions.push(cleanedTransaction);
  }

  return {
    output: {
      channel: '招商银行储蓄卡',
      date: dateRange,
      data: transactions,
    },
  };
}

export default main;


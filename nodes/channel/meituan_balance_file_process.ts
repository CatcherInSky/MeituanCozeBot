// 美团余额文件处理
// 输入：MeituanBalanceOCR[]数组
// 输出：ChannelDataGroup格式的数据
import { 
  MeituanBalanceOCR,
  MeituanBalance, 
  ChannelDataGroup, 
  PaymentChannel,
  FunctionArgs,
  FunctionOutput
} from '../../types';
import dayjs from 'dayjs';

type Args = FunctionArgs<{ input: string }>;
type Output = FunctionOutput<ChannelDataGroup>;

/**
 * 将MeituanBalanceOCR转换为MeituanBalance
 * @param ocrData OCR识别的数据
 * @returns 转换后的MeituanBalance数据
 */
function convertOCRToBalance(ocrData: MeituanBalanceOCR): MeituanBalance {
  // 使用dayjs将日期字符串转换为秒级时间戳（与项目其他文件保持一致）
  const timestamp = dayjs(ocrData.date).unix();
  
  // 生成唯一ID：时间戳_金额_描述前10字符
  const namePrefix = ocrData.name.substring(0, 10).replace(/[^\w\u4e00-\u9fa5]/g, '');
  const id = `${timestamp}_${ocrData.amount}_${namePrefix}`;
  
  return {
    amount: ocrData.amount,
    type: ocrData.type,
    name: ocrData.name,
    date: timestamp,
    channel: '美团余额' as const,
    id: id
  };
}

/**
 * 从MeituanBalanceOCR[]数组中提取日期范围
 * @param ocrDataArray OCR数据数组
 * @returns 日期范围 [开始时间, 结束时间]
 */
function extractDateRange(ocrDataArray: MeituanBalanceOCR[]): [string, string] {
  if (ocrDataArray.length === 0) {
    return ['', ''];
  }
  
  // 使用dayjs将所有日期转换为秒级时间戳进行比较
  const timestamps = ocrDataArray.map(item => dayjs(item.date).unix());
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  
  // 使用dayjs转换回日期字符串格式（秒级时间戳需要乘以1000转换为毫秒）
  const startDate = dayjs(minTimestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
  const endDate = dayjs(maxTimestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
  
  return [startDate, endDate];
}

/**
 * 验证MeituanBalanceOCR数据的有效性
 * @param ocrData OCR数据
 * @param index 数据索引（用于错误提示）
 * @throws 如果数据无效则抛出错误
 */
function validateOCRData(ocrData: MeituanBalanceOCR, index: number): void {
  if (typeof ocrData.amount !== 'number') {
    throw new Error(`第${index + 1}条记录：amount字段必须是数字`);
  }
  
  if (!ocrData.name || typeof ocrData.name !== 'string') {
    throw new Error(`第${index + 1}条记录：name字段不能为空`);
  }
  
  if (!ocrData.type || typeof ocrData.type !== 'string') {
    throw new Error(`第${index + 1}条记录：type字段不能为空`);
  }
  
  if (!ocrData.date || typeof ocrData.date !== 'string') {
    throw new Error(`第${index + 1}条记录：date字段不能为空`);
  }
  
  // 使用dayjs验证日期格式
  const dateObj = dayjs(ocrData.date);
  if (!dateObj.isValid()) {
    throw new Error(`第${index + 1}条记录：date字段格式不正确，应为YYYY-MM-DD HH:mm:ss格式`);
  }
}

/**
 * 处理MeituanBalanceOCR[]数组并构建ChannelDataGroup
 * @param ocrDataArray OCR数据数组
 * @returns ChannelDataGroup格式的数据
 */
function processOCRData(ocrDataArray: MeituanBalanceOCR[]): ChannelDataGroup {
  // 验证输入
  if (!Array.isArray(ocrDataArray)) {
    throw new Error('输入数据必须是MeituanBalanceOCR[]数组');
  }
  
  if (ocrDataArray.length === 0) {
    return {
      channel: '美团余额' as const,
      date: ['', ''],
      data: []
    };
  }
  
  // 验证每个OCR数据项
  ocrDataArray.forEach((item, index) => {
    validateOCRData(item, index);
  });
  
  // 转换为MeituanBalance格式
  const balanceData: MeituanBalance[] = ocrDataArray.map(convertOCRToBalance);
  
  // 按时间排序（最新的在前）
  balanceData.sort((a, b) => b.date - a.date);
  
  // 提取日期范围
  const dateRange = extractDateRange(ocrDataArray);
  
  return {
    channel: '美团余额' as const,
    date: dateRange,
    data: balanceData
  };
}

async function main({ params }: Args): Promise<Output> {
  try {
    const { input } = params;
    const data = JSON.parse(input) as MeituanBalanceOCR[];
    // 验证输入
    if (!data) {
      throw new Error('输入参数不能为空');
    }
    
    // 处理OCR数据
    const result = processOCRData(data);
    
    return {
      output: result
    };
  } catch (error) {
    console.error('Error in meituan_balance_file_process.ts main function:', error);
    return {
      output: {
        channel: '美团余额' as const,
        date: ['', ''],
        data: []
      }
    };
  }
}

export default main;

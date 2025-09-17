// 入参GroupData
// 出参DataOutput（不含美团）
// 汇总输入的所有支付渠道数据
import { 
  GroupData, 
  DataOutput, 
  PaymentChannel, 
  DateList, 
  PaymentData, 
  FunctionArgs,
  FunctionOutput
} from '../types';

type Args = FunctionArgs<{ input: GroupData[] }>;
type Output = FunctionOutput<DataOutput> & { dateList: DateList };

/**
 * 根据id字段去重
 * @param items 数据数组
 * @returns 去重后的数组
 */
function deduplicateById<T extends { id?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.id) return true; // 如果没有id字段，保留
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * 按date字段降序排序
 * @param items 数据数组
 * @returns 排序后的数组
 */
function sortByDateDesc<T extends { date?: number }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const dateA = a.date || 0;
    const dateB = b.date || 0;
    return dateB - dateA; // 降序
  });
}

/**
 * 处理支付渠道数据
 * @param channelData 渠道数据
 * @returns 处理后的数据数组
 */
function processPaymentData(channelData: PaymentData[]): PaymentData[] {
  
  // 去重 todo 会有问题暂时不去重
  // const deduplicated = deduplicateById(channelData);
  
  // 按时间降序排序
  return sortByDateDesc(channelData);
}

async function main({ params }: Args): Promise<Output> {
  const { input } = params;
  
  // 暂存各渠道数据（先聚合，稍后再移除空key）
  const temp: DataOutput = {} as DataOutput;
  const dateList = [] as DateList;
  
  // 遍历所有Group数据
  for (const group of input) {
    if (!group) continue;
    
    // 遍历Group中的每个渠道
    for (const [groupKey, channelData] of Object.entries(group)) {
      if (!channelData || !channelData.data) continue;
      
      const channel = channelData.channel;
      const data = channelData.data;
      const date = channelData.date;
      dateList.push({
        channel,
        date,
      })
      Array.isArray(temp[channel]) ? temp[channel].push(...data) : temp[channel] = data;
    }
  }
  
  // 构造最终输出：只保留非空数组的key
  const result: Partial<DataOutput> = {};
  
  // 动态遍历temp对象的所有key，只保留非空数组
  for (const [key, value] of Object.entries(temp)) {
    if (Array.isArray(value) && value.length > 0) {
      // @ts-expect-error 动态key赋值
      result[key as keyof DataOutput] = processPaymentData(value);
    }
  }

  return {
    // @ts-expect-error 结果为DataOutput子集，调用方按存在的key使用
    output: result,
    dateList,
  };
}

export default main;
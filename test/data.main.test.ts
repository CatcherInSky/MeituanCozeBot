import dataMain from '../nodes/data';
import { 
  mockGroupData, 
  expectedDataOutput, 
  expectedDateList,
  emptyGroupData,
  nullGroupData,
  invalidGroupData
} from './fixtures/test-data';
import { GroupData, DataOutput, DateList } from '../types';

describe('data.ts main function', () => {
  
  describe('正常数据处理', () => {
    test('应该正确处理包含多个渠道的GroupData', async () => {
      const input = { params: { input: mockGroupData } };
      const result = await dataMain(input);
      
      // 验证返回结构
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('dateList');
      
      // 验证output包含正确的渠道数据
      expect(result.output).toHaveProperty('微信支付');
      expect(result.output).toHaveProperty('支付宝');
      expect(result.output).toHaveProperty('招商银行信用卡');
      expect(result.output).toHaveProperty('招商银行储蓄卡');
      expect(result.output).toHaveProperty('美团余额');
      
      // 验证每个渠道的数据数量
      expect(result.output['微信支付']).toHaveLength(1);
      expect(result.output['支付宝']).toHaveLength(1);
      expect(result.output['招商银行信用卡']).toHaveLength(2);
      expect(result.output['招商银行储蓄卡']).toHaveLength(1);
      expect(result.output['美团余额']).toHaveLength(1);
      
      // 验证dateList长度
      expect(result.dateList).toHaveLength(5);
    });

    test('应该正确生成dateList', async () => {
      const input = { params: { input: mockGroupData } };
      const result = await dataMain(input);
      
      // 验证dateList包含正确的渠道和日期范围
      const dateList = result.dateList;
      expect(dateList).toContainEqual({
        channel: "微信支付",
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
      expect(dateList).toContainEqual({
        channel: "支付宝", 
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
      expect(dateList).toContainEqual({
        channel: "招商银行信用卡",
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
      expect(dateList).toContainEqual({
        channel: "招商银行储蓄卡",
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
      expect(dateList).toContainEqual({
        channel: "美团余额",
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
    });

    test('应该按时间降序排序数据', async () => {
      const input = { params: { input: mockGroupData } };
      const result = await dataMain(input);
      
      // 验证招商银行信用卡数据的排序（有2条数据）
      const cmbData = result.output['招商银行信用卡'];
      expect(cmbData).toHaveLength(2);
      
      // 第一条应该是时间更晚的（date更大的）
      expect(cmbData[0].date).toBeGreaterThanOrEqual(cmbData[1].date);
    });
  });

  describe('边界情况处理', () => {
    test('应该正确处理空的GroupData数组', async () => {
      const input = { params: { input: emptyGroupData } };
      const result = await dataMain(input);
      
      expect(result.output).toEqual({});
      expect(result.dateList).toEqual([]);
    });

    test('应该正确处理包含空对象的GroupData', async () => {
      const input = { params: { input: nullGroupData } };
      const result = await dataMain(input);
      
      expect(result.output).toEqual({});
      expect(result.dateList).toEqual([]);
    });

    test('应该正确处理包含无效数据的GroupData', async () => {
      const input = { params: { input: invalidGroupData } };
      const result = await dataMain(input);
      
      // 应该跳过null数据，只处理有效的空数据组
      expect(result.output).toEqual({});
      expect(result.dateList).toHaveLength(1);
      expect(result.dateList[0]).toEqual({
        channel: "微信支付",
        date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"]
      });
    });
  });

  describe('数据类型验证', () => {
    test('返回的数据应该符合类型定义', async () => {
      const input = { params: { input: mockGroupData } };
      const result = await dataMain(input);
      
      // 验证每个支付数据的必需字段
      Object.values(result.output).forEach(channelData => {
        channelData.forEach(payment => {
          expect(payment).toHaveProperty('amount');
          expect(payment).toHaveProperty('date');
          expect(payment).toHaveProperty('id');
          
          // 验证数据类型
          expect(typeof payment.amount).toBe('number');
          expect(payment.amount).not.toBeNaN();
          expect(typeof payment.date).toBe('number');
          expect(payment.date).toBeGreaterThan(0);
          expect(typeof payment.id).toBe('string');
          
          // 验证channel字段存在（不同类型可能有不同的channel字段名）
          const hasChannelField = 'channel' in payment || 'source' in payment;
          expect(hasChannelField).toBe(true);
        });
      });
      
      // 验证dateList的结构
      result.dateList.forEach(dateItem => {
        expect(dateItem).toHaveProperty('channel');
        expect(dateItem).toHaveProperty('date');
        expect(typeof dateItem.channel).toBe('string');
        expect(Array.isArray(dateItem.date)).toBe(true);
        expect(dateItem.date).toHaveLength(2);
      });
    });
  });

  describe('数据合并逻辑', () => {
    test('应该正确合并相同渠道的数据', async () => {
      // 创建包含相同渠道多次出现的测试数据
      const duplicateChannelData: GroupData[] = [
        {
          "wechat1": {
            channel: "微信支付",
            date: ["2025-06-01 00:00:00", "2025-06-15 23:59:59"],
            data: [mockGroupData[0]["wechat"]!.data[0]]
          }
        },
        {
          "wechat2": {
            channel: "微信支付", 
            date: ["2025-06-16 00:00:00", "2025-06-30 23:59:59"],
            data: [mockGroupData[0]["wechat"]!.data[0]] // 重复相同数据
          }
        }
      ];
      
      const input = { params: { input: duplicateChannelData } };
      const result = await dataMain(input);
      
      // 验证相同渠道的数据被合并
      expect(result.output['微信支付']).toHaveLength(2); // 两条相同的数据
      expect(result.dateList).toHaveLength(2); // 但有两个不同的日期范围
    });
  });

  describe('异常处理', () => {
    test('应该优雅地处理异常输入', async () => {
      // 测试异常输入不会导致崩溃
      const invalidInput = { params: { input: null as any } };
      const result = await dataMain(invalidInput);
      
      expect(result.output).toEqual({});
      expect(result.dateList).toEqual([]);
    });

    test('应该处理缺少必需字段的数据', async () => {
      const incompleteData: GroupData[] = [
        {
          "incomplete": {
            channel: "微信支付",
            date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"],
            data: [
              {
                // 缺少必需字段的数据
                amount: 10.00,
                // 缺少 date, channel, id 等字段
              } as any
            ]
          }
        }
      ];
      
      const input = { params: { input: incompleteData } };
      const result = await dataMain(input);
      
      // 应该仍然能处理，不会崩溃
      expect(result.output).toHaveProperty('微信支付');
      expect(result.dateList).toHaveLength(1);
    });
  });
});

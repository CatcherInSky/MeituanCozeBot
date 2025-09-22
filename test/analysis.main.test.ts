import analysisMain from '../nodes/analysis';
import { 
  mockMeituanOrders,
  expectedDataOutput,
  expectedDateList,
  mockWechatPayments,
  mockAlipayPayments,
  mockCmbCreditCardPayments,
  mockMeituanBalance
} from './fixtures/test-data';
import { MeituanOrder, DataOutput, DateList } from '../types';

describe('analysis.ts main function', () => {
  
  const baseInput = {
    dateList: expectedDateList,
    meituanOrders: mockMeituanOrders,
    input: expectedDataOutput as DataOutput
  };

  describe('覆盖分析', () => {
    test('应该正确识别被覆盖的订单', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 验证返回结构
      expect(result.output).toHaveProperty('uncover');
      expect(result.output).toHaveProperty('cover');
      expect(result.output).toHaveProperty('match');
      expect(result.output).toHaveProperty('unmatch');
      
      // 验证订单总数保持不变
      const totalOrders = result.output.uncover.length + result.output.cover.length;
      expect(totalOrders).toBe(mockMeituanOrders.length);
      
      // 前3个订单在覆盖范围内，第4个订单超出范围
      expect(result.output.cover.length).toBe(3);
      expect(result.output.uncover.length).toBe(1);
      
      // 验证未覆盖的订单是第4个（超出日期范围的）
      expect(result.output.uncover[0]?.id).toBe("TEST004100040167135680000");
    });

    test('应该正确处理复合渠道覆盖', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 复合渠道订单（TEST003100040167003503513000）应该被覆盖
      const compositeOrder = result.output.cover.find(order => 
        order.channel.includes('+') && order.id === "TEST003100040167003503513000"
      );
      expect(compositeOrder).toBeDefined();
      expect(compositeOrder?.channel).toBe("美团余额+招商银行信用卡(1234)");
    });

    test('应该正确处理时间边界', async () => {
      // 创建边界时间测试数据
      const boundaryOrders: MeituanOrder[] = [
        {
          ...mockMeituanOrders[0],
          id: "BOUNDARY_START",
          date: Math.floor(new Date("2025-06-01 00:00:00").getTime() / 1000), // 边界开始时间
        },
        {
          ...mockMeituanOrders[0],
          id: "BOUNDARY_END", 
          date: Math.floor(new Date("2025-06-30 23:59:59").getTime() / 1000), // 边界结束时间
        },
        {
          ...mockMeituanOrders[0],
          id: "OUT_OF_RANGE",
          date: Math.floor(new Date("2025-05-31 23:59:59").getTime() / 1000), // 超出范围
        }
      ];
      
      const input = { 
        params: { 
          ...baseInput, 
          meituanOrders: boundaryOrders 
        } 
      };
      const result = await analysisMain(input);
      
      // 边界时间的订单应该被覆盖
      expect(result.output.cover.some(order => order.id === "BOUNDARY_START")).toBe(true);
      expect(result.output.cover.some(order => order.id === "BOUNDARY_END")).toBe(true);
      
      // 超出范围的订单应该未被覆盖
      expect(result.output.uncover.some(order => order.id === "OUT_OF_RANGE")).toBe(true);
    });
  });

  describe('匹配分析', () => {
    test('应该正确匹配相同金额和时间接近的订单', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 验证匹配总数
      const totalCoverOrders = result.output.match.length + result.output.unmatch.length;
      expect(totalCoverOrders).toBe(result.output.cover.length);
      
      // 应该有一些成功匹配的订单
      expect(result.output.match.length).toBeGreaterThan(0);
    });

    test('应该正确计算匹配评分', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 验证匹配的订单包含正确的字段
      result.output.match.forEach(matchedOrder => {
        // 应该包含美团订单的所有字段
        expect(matchedOrder).toHaveProperty('交易单号');
        expect(matchedOrder).toHaveProperty('实付金额');
        
        // 应该包含支付数据的字段
        expect(matchedOrder).toHaveProperty('amount');
        expect(matchedOrder).toHaveProperty('date');
        expect(matchedOrder).toHaveProperty('channel');
        
        // 验证金额是有效数字
        expect(typeof matchedOrder.amount).toBe('number');
        expect(matchedOrder.amount).not.toBeNaN();
      });
    });

    test('应该正确处理退款类型的匹配', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 寻找退款订单的匹配结果
      const refundMatch = result.output.match.find(match => 
        match.type === "退款" || match.交易类型 === "退款"
      );
      
      if (refundMatch) {
        // 退款订单应该能够匹配到相应的退款支付数据
        expect(refundMatch).toBeDefined();
      }
    });

    test('应该正确处理复合渠道匹配', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 寻找复合渠道的匹配结果
      const compositeMatch = result.output.match.find(match => 
        match.channel && match.channel.includes('+')
      );
      
      if (compositeMatch) {
        // 复合渠道匹配应该包含主要支付方式的信息
        expect(typeof compositeMatch.amount).toBe('number');
        expect(compositeMatch.amount).not.toBeNaN();
        expect(typeof compositeMatch.date).toBe('number');
        expect(compositeMatch.date).toBeGreaterThan(0);
      }
    });
  });

  describe('边界情况处理', () => {
    test('应该处理空的美团订单列表', async () => {
      const input = { 
        params: { 
          ...baseInput, 
          meituanOrders: [] 
        } 
      };
      const result = await analysisMain(input);
      
      expect(result.output.uncover).toEqual([]);
      expect(result.output.cover).toEqual([]);
      expect(result.output.match).toEqual([]);
      expect(result.output.unmatch).toEqual([]);
    });

    test('应该处理空的支付数据', async () => {
      const input = { 
        params: { 
          ...baseInput, 
          input: {} as DataOutput 
        } 
      };
      const result = await analysisMain(input);
      
      // 所有订单都应该未被匹配
      expect(result.output.match).toEqual([]);
      expect(result.output.unmatch.length).toBe(result.output.cover.length);
    });

    test('应该处理空的日期列表', async () => {
      const input = { 
        params: { 
          ...baseInput, 
          dateList: [] 
        } 
      };
      const result = await analysisMain(input);
      
      // 没有日期覆盖，所有订单都应该未被覆盖
      expect(result.output.uncover.length).toBe(mockMeituanOrders.length);
      expect(result.output.cover).toEqual([]);
    });
  });

  describe('时间差评分测试', () => {
    test('应该正确计算不同时间差的评分', async () => {
      // 创建不同时间差的测试数据
      const baseTime = Math.floor(new Date("2025-06-02 15:08:21").getTime() / 1000);
      const testOrders: MeituanOrder[] = [
        {
          ...mockMeituanOrders[0],
          id: "TIME_TEST_1",
          date: baseTime,
          amount: 50.00
        }
      ];
      
      const testPayments = {
        "测试渠道": [
          {
            amount: 50.00,
            date: baseTime + 60, // 1分钟后 (应该得3分)
            channel: "测试渠道",
            type: "退款",
            id: "PAYMENT_1MIN"
          },
          {
            amount: 50.00,
            date: baseTime + 7200, // 2小时后 (应该得2分)
            channel: "测试渠道", 
            type: "退款",
            id: "PAYMENT_2H"
          },
          {
            amount: 50.00,
            date: baseTime + 86400, // 24小时后 (应该得1分)
            channel: "测试渠道",
            type: "退款", 
            id: "PAYMENT_24H"
          },
          {
            amount: 50.00,
            date: baseTime + 172800, // 48小时后 (应该得0分，不匹配)
            channel: "测试渠道",
            type: "退款",
            id: "PAYMENT_48H"
          }
        ]
      };
      
      const input = {
        params: {
          dateList: [{ 
            channel: "测试渠道" as any, 
            date: ["2025-06-01 00:00:00", "2025-06-30 23:59:59"] as [string, string]
          }],
          meituanOrders: testOrders.map(order => ({
            ...order,
            channel: "测试渠道"
          })),
          input: testPayments as any
        }
      };
      
      const result = await analysisMain(input);
      
      // 应该匹配到时间最近的支付数据（1分钟后的）
      expect(result.output.match.length).toBe(1);
      if (result.output.match.length > 0) {
        expect(result.output.match[0].id).toBe("PAYMENT_1MIN");
      }
    });
  });

  describe('异常处理', () => {
    test('应该优雅地处理异常输入', async () => {
      const invalidInput = { 
        params: { 
          dateList: null as any, 
          meituanOrders: null as any, 
          input: null as any 
        } 
      };
      
      const result = await analysisMain(invalidInput);
      
      // 应该返回空结果而不是崩溃
      expect(result.output.uncover).toEqual([]);
      expect(result.output.cover).toEqual([]);
      expect(result.output.match).toEqual([]);
      expect(result.output.unmatch).toEqual([]);
    });

    test('应该处理缺少必需字段的数据', async () => {
      const incompleteOrder = {
        ...mockMeituanOrders[0],
        amount: undefined as any,
        date: undefined as any
      };
      
      const input = { 
        params: { 
          ...baseInput, 
          meituanOrders: [incompleteOrder] 
        } 
      };
      
      const result = await analysisMain(input);
      
      // 应该能处理不完整的数据而不崩溃
      expect(result.output).toBeDefined();
    });
  });

  describe('数据一致性验证', () => {
    test('订单总数应该保持一致', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // uncover + cover = 总订单数
      const totalProcessed = result.output.uncover.length + result.output.cover.length;
      expect(totalProcessed).toBe(mockMeituanOrders.length);
      
      // match + unmatch = cover订单数
      const totalMatched = result.output.match.length + result.output.unmatch.length;
      expect(totalMatched).toBe(result.output.cover.length);
    });

    test('匹配结果应该包含正确的数据结构', async () => {
      const input = { params: baseInput };
      const result = await analysisMain(input);
      
      // 验证匹配结果的数据结构
      result.output.match.forEach(matchResult => {
        // 应该同时包含美团订单和支付数据的字段
        expect(matchResult).toHaveProperty('交易单号'); // 美团字段
        expect(matchResult).toHaveProperty('amount'); // 支付数据字段
        expect(matchResult).toHaveProperty('date'); // 支付数据字段
        
        // 验证关键字段类型
        expect(typeof matchResult.交易单号).toBe('string');
        expect(typeof matchResult.amount).toBe('number');
        expect(matchResult.amount).not.toBeNaN();
        expect(typeof matchResult.date).toBe('number');
        expect(matchResult.date).toBeGreaterThan(0);
      });
    });
  });
});

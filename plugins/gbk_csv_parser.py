import asyncio
import json
import csv
import io
from typing import List, Dict, Any, Optional
import requests_async as requests


class AlipayCSVParser:
    """支付宝CSV文件解析器 - Coze版本"""
    
    def __init__(self):
        self.supported_encodings = ['gbk', 'gb2312', 'utf-8', 'utf-8-sig']
    
    async def fetch_csv_from_url(self, url: str) -> str:
        """从URL获取CSV文件内容"""
        try:
            response = await requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.content
            
            # 检测编码
            encoding = self.detect_encoding(content)
            return content.decode(encoding)
        except Exception as e:
            raise Exception(f"获取CSV文件失败: {str(e)}")
    
    def detect_encoding(self, content: bytes) -> str:
        """检测文件编码"""
        for encoding in self.supported_encodings:
            try:
                content.decode(encoding)
                return encoding
            except UnicodeDecodeError:
                continue
        return 'gbk'  # 默认使用GBK编码
    
    def parse_csv_content(self, content: str) -> List[Dict[str, Any]]:
        """解析CSV内容为JSON格式"""
        try:
            # 按行分割内容
            lines = content.strip().split('\n')
            
            # 查找数据开始行（跳过头部信息）
            data_start_line = 0
            for i, line in enumerate(lines):
                if '交易时间' in line and '交易对方' in line:
                    data_start_line = i
                    break
            
            if data_start_line == 0:
                raise Exception("未找到CSV数据表头")
            
            # 解析表头
            header_line = lines[data_start_line]
            headers = [col.strip() for col in header_line.split(',')]
            
            # 解析数据行
            data_rows = []
            for line in lines[data_start_line + 1:]:
                if not line.strip():
                    continue
                
                # 处理CSV行，考虑引号和逗号
                row_data = self._parse_csv_line(line)
                if len(row_data) >= len(headers):
                    row_dict = {}
                    for i, header in enumerate(headers):
                        if i < len(row_data):
                            row_dict[header] = row_data[i].strip()
                        else:
                            row_dict[header] = ""
                    data_rows.append(row_dict)
            
            return data_rows
            
        except Exception as e:
            raise Exception(f"解析CSV内容失败: {str(e)}")
    
    def _parse_csv_line(self, line: str) -> List[str]:
        """解析CSV行，处理引号和逗号"""
        result = []
        current_field = ""
        in_quotes = False
        
        i = 0
        while i < len(line):
            char = line[i]
            
            if char == '"':
                if in_quotes and i + 1 < len(line) and line[i + 1] == '"':
                    # 转义的引号
                    current_field += '"'
                    i += 1
                else:
                    # 切换引号状态
                    in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                # 字段分隔符
                result.append(current_field)
                current_field = ""
            else:
                current_field += char
            
            i += 1
        
        # 添加最后一个字段
        result.append(current_field)
        return result
    
    async def process_alipay_csv(self, url: str) -> Dict[str, Any]:
        """处理支付宝CSV文件的主要方法"""
        try:
            # 获取CSV内容
            content = await self.fetch_csv_from_url(url)
            
            # 解析CSV内容
            data_rows = self.parse_csv_content(content)
            
            # 构建返回结果
            result = {
                "success": True,
                "total_records": len(data_rows),
                "data": data_rows,
                "message": f"成功解析{len(data_rows)}条记录"
            }
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "total_records": 0
            }


async def main(args) -> dict:
    """主函数，用于Coze代码节点"""
    # 按照demo格式获取URL: args.params['input']
    try:
        url = args.params['input']
        
        # 验证URL是否有效
        if not url or not isinstance(url, str) or not url.strip():
            return {
                "output": json.dumps({"success": False, "error": "input参数为空或无效", "data": [], "total_records": 0}, ensure_ascii=False, indent=2),
                "message": "解析失败: input参数为空或无效"
            }
            
    except (AttributeError, KeyError, TypeError) as e:
        return {
            "output": json.dumps({"success": False, "error": f"参数解析失败: {str(e)}", "data": [], "total_records": 0}, ensure_ascii=False, indent=2),
            "message": f"解析失败: 参数解析失败 - {str(e)}"
        }
    
    parser = AlipayCSVParser()
    result = await parser.process_alipay_csv(url)
    
    if result["success"]:
        return {
            "output": json.dumps(result, ensure_ascii=False, indent=2),
            "message": f"成功解析{result['total_records']}条记录"
        }
    else:
        return {
            "output": json.dumps(result, ensure_ascii=False, indent=2),
            "message": f"解析失败: {result['error']}"
        }


# Coze代码节点使用示例：
# 在Coze工作流中，将此代码作为Python代码节点使用
# 输入参数：args.params['input'] - input为CSV文件的URL
# 输出格式：{output: string, message: string}

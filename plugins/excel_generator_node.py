"""
Excel文件生成器工具 - 简化版

根据DataOutput数据生成具有多个sheet的Excel表格
每个sheet对应DataOutput的一个key-value对
sheet名称为key，sheet内容为value数组
表头从value数组的第一个元素中提取

使用CSV格式生成多文件压缩包，适合Coze环境（只使用标准库）

Parameters:
args: parameters of the entry function.
args.input - DataOutput格式的数据，直接传入字典对象

Return:
The return data of the function, which should match the declared output parameters.
"""

import json
import io
import base64
import csv
import zipfile
from typing import Dict, List, Any, Optional


class SimpleExcelGenerator:
    """简化版Excel文件生成器（只使用标准库）"""
    
    def __init__(self):
        pass
    
    def generate_excel_from_data(self, data_output: Dict[str, Any]) -> bytes:
        """根据DataOutput生成ZIP文件（包含多个CSV文件）"""
        try:
            return self._generate_zip_with_csv(data_output)
        except Exception as e:
            raise Exception(f"生成文件失败: {str(e)}")
    
    def _generate_zip_with_csv(self, data_output: Dict[str, Any]) -> bytes:
        """生成包含多个CSV文件的ZIP压缩包"""
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 遍历DataOutput的每个key-value对
            for sheet_name, data_list in data_output.items():
                if not data_list or not isinstance(data_list, list):
                    continue
                
                # 生成CSV文件名
                csv_filename = f"{sheet_name}.csv"
                
                # 创建CSV内容
                csv_content = self._generate_csv_content(data_list)
                
                # 添加到ZIP文件
                zip_file.writestr(csv_filename, csv_content)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
    
    def _generate_csv_content(self, data_list: List[Any]) -> str:
        """生成CSV内容"""
        if not data_list:
            return ""
        
        # 创建CSV内容
        csv_buffer = io.StringIO()
        
        # 获取表头（从第一个数据项中提取）
        first_item = data_list[0]
        if isinstance(first_item, dict):
            headers = list(first_item.keys())
        else:
            headers = [f'Column_{i+1}' for i in range(len(first_item) if hasattr(first_item, '__len__') else 1)]
        
        # 写入CSV
        writer = csv.writer(csv_buffer)
        
        # 写入表头
        writer.writerow(headers)
        
        # 写入数据
        for item in data_list:
            if isinstance(item, dict):
                row = []
                for header in headers:
                    value = item.get(header, '')
                    if value is None:
                        value = ''
                    elif isinstance(value, (dict, list)):
                        value = json.dumps(value, ensure_ascii=False)
                    row.append(str(value))
                writer.writerow(row)
            else:
                if hasattr(item, '__len__') and not isinstance(item, str):
                    row = [str(v) for v in item]
                else:
                    row = [str(item)]
                writer.writerow(row)
        
        return csv_buffer.getvalue()


def main(args) -> dict:
    """主函数 - Excel文件生成器入口"""
    try:
        # 获取输入参数
        data_output = args.params['input']
        
        # 验证输入参数
        if not data_output or not isinstance(data_output, dict):
            print("解析失败: data_output参数为空或格式不正确")
            return {
                "download_url": "",
                "message": "解析失败: data_output参数为空或格式不正确"
            }
        
        print(f"开始生成数据文件，包含{len(data_output)}个CSV文件")
        
        # 生成ZIP文件
        generator = SimpleExcelGenerator()
        zip_content = generator.generate_excel_from_data(data_output)
        
        # 将文件内容编码为base64
        file_base64 = base64.b64encode(zip_content).decode('utf-8')
        
        # 根据文件类型设置MIME类型
        if isinstance(zip_content, bytes) and zip_content.startswith(b'PK'):
            # 这是一个ZIP文件
            mime_type = "application/zip"
            file_extension = "zip"
        else:
            # 这是JSON文件
            mime_type = "application/json"
            file_extension = "json"
        
        download_url = f"data:{mime_type};base64,{file_base64}"
        
        print(f"文件生成成功，大小: {len(zip_content)} bytes，类型: {file_extension}")
        
        return {
            "download_url": download_url,
            "message": f"成功生成{file_extension.upper()}文件，包含{len(data_output)}个CSV文件，文件大小: {len(zip_content)} bytes"
        }
        
    except Exception as e:
        print(f"文件生成失败: {str(e)}")
        return {
            "download_url": "",
            "message": f"文件生成失败: {str(e)}"
        }

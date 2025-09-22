"""
Excel文件生成器工具

将结构化数据转换为Excel文件（ZIP格式，包含多个CSV文件）
支持多Sheet数据，每个Sheet对应一个数据表
适合用于数据导出、报表生成等场景

Each file needs to export a function named `handler`. This function is the entrance to the Tool.

Parameters:
args: parameters of the entry function.
args.input - input parameters, you can get test input value by args.input.xxx.
args.logger - logger instance used to print logs, injected by runtime.

Remember to fill in input/output in Metadata , it helps LLM to recognize and use tool.

Return:
The return data of the function, which should match the declared output parameters.
"""

import json
import io
import base64
import csv
import zipfile
from typing import Dict, List, Any, Optional


class ExcelGenerator:
    """Excel文件生成器（基于CSV的ZIP格式）"""
    
    def __init__(self):
        self.supported_formats = ['dict', 'list', 'json']
    
    def generate_excel_from_data(self, data_output: Dict[str, Any]) -> bytes:
        """根据结构化数据生成ZIP文件（包含多个CSV文件）"""
        try:
            return self._generate_zip_with_csv(data_output)
        except Exception as e:
            raise Exception(f"生成文件失败: {str(e)}")
    
    def _generate_zip_with_csv(self, data_output: Dict[str, Any]) -> bytes:
        """生成包含多个CSV文件的ZIP压缩包"""
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 遍历数据的每个key-value对
            for sheet_name, data_list in data_output.items():
                if not data_list or not isinstance(data_list, list):
                    continue
                
                # 生成CSV文件名（清理特殊字符）
                clean_sheet_name = self._clean_filename(str(sheet_name))
                csv_filename = f"{clean_sheet_name}.csv"
                
                # 创建CSV内容
                csv_content = self._generate_csv_content(data_list)
                
                # 添加到ZIP文件
                zip_file.writestr(csv_filename, csv_content)
        
        zip_buffer.seek(0)
        return zip_buffer.getvalue()
    
    def _clean_filename(self, filename: str) -> str:
        """清理文件名，移除特殊字符"""
        import re
        # 移除或替换文件名中的特殊字符
        clean_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
        # 限制文件名长度
        if len(clean_name) > 50:
            clean_name = clean_name[:50]
        return clean_name or "sheet"
    
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
    
    def validate_input_data(self, data: Any) -> Dict[str, Any]:
        """验证输入数据格式"""
        if not data:
            raise ValueError("输入数据不能为空")
        
        if not isinstance(data, dict):
            raise ValueError("输入数据必须是字典格式")
        
        # 验证每个值都是列表
        for key, value in data.items():
            if not isinstance(value, list):
                raise ValueError(f"键 '{key}' 对应的值必须是列表格式")
        
        return data


def handler(args) -> dict:
    """主函数 - Excel文件生成器入口"""
    try:
        # 获取输入参数（字符串格式）
        input_string = args.input.input
        
        # 验证输入参数
        if not input_string or not isinstance(input_string, str):
            args.logger.error("生成失败: input参数为空或不是字符串格式")
            return {
                "download_url": "",
                "message": "生成失败: input参数为空或不是字符串格式"
            }
        
        args.logger.info(f"开始生成Excel文件，输入字符串长度: {len(input_string)}")
        
        # 解析JSON字符串
        try:
            input_data = json.loads(input_string)
        except json.JSONDecodeError as e:
            args.logger.error(f"JSON解析失败: {str(e)}")
            return {
                "download_url": "",
                "message": f"JSON解析失败: {str(e)}"
            }
        
        # 验证和转换数据格式
        generator = ExcelGenerator()
        validated_data = generator.validate_input_data(input_data)
        
        args.logger.info(f"数据验证通过，包含{len(validated_data)}个数据表")
        
        # 生成ZIP文件
        zip_content = generator.generate_excel_from_data(validated_data)
        
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
        
        args.logger.info(f"文件生成成功，大小: {len(zip_content)} bytes，类型: {file_extension}")
        
        return {
            "download_url": download_url,
            "message": f"成功生成{file_extension.upper()}文件，包含{len(validated_data)}个数据表，文件大小: {len(zip_content)} bytes"
        }
        
    except Exception as e:
        args.logger.error(f"文件生成失败: {str(e)}")
        return {
            "download_url": "",
            "message": f"文件生成失败: {str(e)}"
        }

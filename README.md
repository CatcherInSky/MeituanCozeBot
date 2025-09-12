# MeituanCozeBot
记录coze判断美团退款数据bot中使用的函数

# 如何新增渠道
## 代码修改
### url_branch
新增新渠道的判断语句以及枚举值

### file_process
根据对应类型数据处理之后（csv xlsx pdf等），完善解析表单数据的函数

### final

## 工作流修改
### money_data_process
在循环体中修改所有和ts文件名字相同的代码节点
在选择器和变量聚合节点中添加对应的判断分支
根据渠道文件类型新增文件解析器
将对应file_process代码节点添加到解析器后面

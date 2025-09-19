// 在这里，您可以通过 'params'  获取节点中的输入变量，并通过 'ret' 输出结果
// 'params' 已经被正确地注入到环境中
// 下面是一个示例，获取节点输入中参数名为'input'的值：
// const input = params.input; 
// 下面是一个示例，输出一个包含多种数据类型的 'ret' 对象：
// const ret = { "name": '小明', "hobbies": ["看书", "旅游"] };

async function main({ params }: any) {
    const { input, meituan, match, unmatch, uncover } = params;
    const output = input || {};
    if(meituan && meituan.length > 0) output['美团'] = meituan
    if(match && match.length > 0) output['已匹配订单'] = match
    if(unmatch && unmatch.length > 0) output['无法匹配订单'] = unmatch
    if(uncover && uncover.length > 0) output['不参与对比订单'] = uncover

    return {
        output
    }
}
import { parse } from '@typescript-eslint/parser';

export function analyzeCode(code: string) {
    const ast = parse(code, {loc: true});

    let functionCount = 0;
    let totalFunctionSize = 0;
    let complexity = 0;
    let commentLines = 0;

    function traverse(node: any) {
        if(!node) return;

        switch(node.type) {
            case 'FunctionDeclaration':
            case 'FunctionExpression':
                functionCount++;
                if(node.body.loc) {
                    const size = node.body.loc.end.line - node.body.loc.start.line;
                    totalFunctionSize += size;
                }
                break;

            case 'IfStatement':
            case 'ForStatement':
            case 'WhileStatement':
            case 'SwitchStatement':
                complexity++;
                break;
        }

        for (const key in node) {
            if(node[key] && typeof node[key] === 'object') {
                traverse(node[key]);
            }
        }
    }

    traverse(ast);

    return {
        functionCount,
        avgFunctionSize: functionCount > 0 ? totalFunctionSize / functionCount : 0,
        complexity
    }
}
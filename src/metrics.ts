import * as esprima from 'esprima';

interface FunctionMetric {
    name: string;
    complexity: number;
    start: { line: number };
    end: { line: number };
}

interface Metrics {
    functionCount: number;
    complexity: number;
    functions: FunctionMetric[];
}

export function analyzeCode(code: string, detailed: boolean = false): Metrics {
    const ast = esprima.parseScript(code, { loc: true });
    let functionCount = 0;
    let complexity = 0;
    let functions: FunctionMetric[] = [];

    function traverse(node: any) {
        if (!node) return;

        if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
            functionCount++;
            let localComplexity = 1;
            if (node.body && node.body.body) {
                localComplexity += countBranches(node.body.body);
            }
            complexity += localComplexity;
            if (detailed) {
                functions.push({
                    name: node.id ? node.id.name : '(anonymous)',
                    complexity: localComplexity,
                    start: node.loc.start,
                    end: node.loc.end
                });
            }
        }

        for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
                traverse(node[key]);
            }
        }
    }

    function countBranches(body: any[]): number {
        return body.reduce((count, statement) => {
            if (['IfStatement', 'ForStatement', 'WhileStatement', 'SwitchStatement'].includes(statement.type)) {
                return count + 1;
            }
            return count;
        }, 0);
    }

    traverse(ast);
    return { functionCount, complexity, functions };
}

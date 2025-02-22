import * as vscode from 'vscode';
import { analyzeCode } from './metrics';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('codeMetrics.showMetrics', () => {
        const panel = vscode.window.createWebviewPanel(
            'codeMetrics',
            'Code Metrics',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            panel.webview.html = `<h1>No file open</h1>`;
            return;
        }

        const code = editor.document.getText();
        const { functionCount, avgFunctionSize, complexity } = analyzeCode(code);

        panel.webview.html = `
            <html>
                <body>
                    <h2>📊 Code Metrics</h2>
                    <p>Nombre total de functions: <strong>${functionCount}</strong></p>
                    <p>Taille moyenne d'une fonction: <strong>${avgFunctionSize}</strong></p>
                    <p>Complexité cyclomatique: <strong>${complexity}</strong></p>
                </body>
            </html>
        `;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

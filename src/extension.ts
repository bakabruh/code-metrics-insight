import * as vscode from 'vscode';

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
        const lines = code.split('\n').length;
        const words = code.split(/\s+/).length;

        panel.webview.html = `
            <html>
                <body>
                    <h2>📊 Code Metrics</h2>
                    <p>Lines: <strong>${lines}</strong></p>
                    <p>Words: <strong>${words}</strong></p>
                </body>
            </html>
        `;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

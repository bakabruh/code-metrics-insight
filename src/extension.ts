import * as vscode from 'vscode';
import { analyzeCode } from './metrics';

export function activate(context: vscode.ExtensionContext) {
    let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'codeMetrics.showMetrics';
    context.subscriptions.push(statusBar);

    function updateStatusBar() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBar.hide();
            return;
        }

        const code = editor.document.getText();
        const { complexity, functionCount } = analyzeCode(code);

        statusBar.text = `🤓 Complexité: ${complexity} | 🔢 Fonctions: ${functionCount}`;
        statusBar.show();
    }

    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateStatusBar, null, context.subscriptions);

    updateStatusBar();

    let disposable = vscode.commands.registerCommand('codeMetrics.showMetrics', () => {
        const panel = vscode.window.createWebviewPanel(
            'codeMetrics',
            'Analyse du Code',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const code = editor.document.getText();
        const { complexity, functionCount } = analyzeCode(code);

        panel.webview.html = `
            <html>
                <head>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body>
                    <h2>📊 Code Metrics</h2>
                    <canvas id="metricsChart"></canvas>
                    <script>
                        const ctx = document.getElementById('metricsChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ['Fonctions', 'Complexité'],
                                datasets: [{
                                    label: 'Métriques',
                                    data: [${functionCount}, ${complexity}],
                                    backgroundColor: ['#4CAF50', '#FF5733']
                                }]
                            }
                        });
                    </script>
                </body>
            </html>
        `;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

import * as vscode from 'vscode';
import { analyzeCode } from './metrics';

export function activate(context: vscode.ExtensionContext) {
    // Ajout de la barre de statut
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

        statusBar.text = `\ud83e\udd13 Complexité: ${complexity} | \ud83d\udd22 Fonctions: ${functionCount}`;
        statusBar.show();
    }

    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateStatusBar, null, context.subscriptions);

    updateStatusBar();

    // Initialisation du style de la Heatmap
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 99, 71, 0.3)' // Rouge léger pour les zones complexes
    });

    function updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        const ast = analyzeCode(code, true);
        const decorationsArray: vscode.DecorationOptions[] = [];

        ast.functions.forEach((func: any) => {
            if (func.complexity > 5) { // Seuil de complexité
                const decoration = {
                    range: new vscode.Range(func.start.line - 1, 0, func.end.line - 1, 100),
                    hoverMessage: `⚠️ Complexité élevée: ${func.complexity}`
                };
                decorationsArray.push(decoration);
            }
        });

        editor.setDecorations(decorationType, decorationsArray);
    }

    vscode.window.onDidChangeActiveTextEditor(updateDecorations, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(updateDecorations, null, context.subscriptions);

    // Commande pour ouvrir la WebView
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

    // Commande pour exporter les métriques en JSON
    let exportCommand = vscode.commands.registerCommand('codeMetrics.exportMetrics', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const code = editor.document.getText();
        const metrics = analyzeCode(code);

        const uri = await vscode.window.showSaveDialog({
            filters: { 'JSON Files': ['json'] },
            saveLabel: 'Enregistrer les métriques'
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(metrics, null, 2)));
            vscode.window.showInformationMessage(`📁 Fichier exporté: ${uri.fsPath}`);
        }
    });

    context.subscriptions.push(exportCommand);

    // Historique des métriques
    let history: any[] = context.globalState.get('metricsHistory', []);

    vscode.workspace.onDidSaveTextDocument(document => {
        const code = document.getText();
        const metrics = analyzeCode(code);

        history.push({ date: new Date().toISOString(), ...metrics });

        if (history.length > 10) history.shift(); // Garde les 10 derniers enregistrements

        context.globalState.update('metricsHistory', history);
        vscode.window.showInformationMessage('📊 Historique des métriques mis à jour');
    });
}

export function deactivate() {}

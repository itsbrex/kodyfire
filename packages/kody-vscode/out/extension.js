"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.InitAction = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const kodies_1 = require("./kodies");
const ListAction_1 = require("./commands/ListAction");
const SearchAction_1 = require("./commands/SearchAction");
const InstallAction_1 = require("./commands/InstallAction");
const action_1 = require("kodyfire-cli/commands/init/action");
const kodyfire_core_1 = require("kodyfire-core");
class InitAction extends action_1.Action {
    displayMessage(message) {
        vscode.window.showInformationMessage(message);
    }
}
exports.InitAction = InitAction;
const cloneCommand = vscode.commands.registerCommand('kodyfire.install', async (moduleName) => {
    try {
        // Is workspace folder open?
        if (!(await InstallAction_1.InstallAction.isWorkspaceFolderOpen())) {
            InstallAction_1.InstallAction.displayMessage('Please open a workspace folder');
            return;
        }
        // Does package.json exist?
        if (!(await InstallAction_1.InstallAction.doesPackageJsonExist())) {
            let option = {
                title: 'Create package.json?',
            };
            const createPackageJsonFile = await InstallAction_1.InstallAction.showQuickPick(['Yes', 'No'], option);
            vscode.window.createOutputChannel;
            if (createPackageJsonFile) {
                await InstallAction_1.InstallAction.runCommand({
                    command: 'npm',
                    args: ['init'],
                });
            }
            else {
                InstallAction_1.InstallAction.displayMessage('A package.json file is required to install a module');
                return;
            }
        }
        const cmd = await InstallAction_1.InstallAction.runCommand({
            command: 'npm',
            args: ['install', moduleName.label],
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(error);
    }
});
async function activate(context) {
    try {
        InstallAction_1.InstallAction.output = vscode.window.createOutputChannel('kodyfire');
        const kodies = await SearchAction_1.SearchAction.getKodies();
        const kodiesProvider = new kodies_1.KodiesProvider(kodies);
        vscode.window.registerTreeDataProvider('kodyfire-view', kodiesProvider);
        const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '/';
        const installedKodies = await kodyfire_core_1.Package.getInstalledKodiesFromPath(projectRoot);
        const inspectorProvider = new kodies_1.KodiesProvider(installedKodies);
        vscode.window.registerTreeDataProvider('kodyfire-inspector', inspectorProvider);
    }
    catch (error) {
        InstallAction_1.InstallAction.output.show();
        InstallAction_1.InstallAction.output.append(error);
    }
    let disposableInstall = cloneCommand;
    let disposableBoilerPlate = vscode.commands.registerCommand('kodyfire.clone', async () => {
        try {
            // Is workspace folder open?
            if (!(await InstallAction_1.InstallAction.isWorkspaceFolderOpen())) {
                InstallAction_1.InstallAction.displayMessage('Please open a workspace folder');
                return;
            }
            const repoUrl = await InstallAction_1.InstallAction.showInputBox({
                message: 'Enter the repo URL',
                validateInput: (text) => {
                    if (text.length === 0) {
                        return 'Please enter a valid URL';
                    }
                    return null;
                },
            });
            if (!repoUrl) {
                vscode.window.showErrorMessage('Please enter a valid URL');
                return;
            }
            InstallAction_1.InstallAction.displayMessage(repoUrl);
            const repoName = (await InstallAction_1.InstallAction.showInputBox({
                message: 'Enter the repo name',
                validateInput: (text) => {
                    return !/^[A-Za-z\s]+$/.test(text)
                        ? 'Project name not valid'
                        : null;
                },
            })) || '.';
            const cmd = await InstallAction_1.InstallAction.runCommand({
                command: 'git',
                args: ['clone', repoUrl, repoName],
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(error);
        }
    });
    let disposable = vscode.commands.registerCommand('kodyfire.list', async () => {
        try {
            ListAction_1.ListAction.execute();
        }
        catch (error) {
            InstallAction_1.InstallAction.output.show();
            InstallAction_1.InstallAction.output.append(error);
        }
    });
    let initDisposable = vscode.commands.registerCommand('kodyfire.init', async () => {
        try {
            vscode.window.showInformationMessage('Hello World from kodyfire!');
            if (!InstallAction_1.InstallAction.isWorkspaceFolderOpen()) {
                InitAction.displayMessage('Please open a workspace folder');
                return;
            }
            if (!(await InstallAction_1.InstallAction.doesPackageJsonExist())) {
                let option = {
                    title: 'Package.json required. Create package.json?',
                };
                const createPackageJsonFile = await InstallAction_1.InstallAction.showQuickPick(['Yes', 'No'], option);
                vscode.window.createOutputChannel;
                if (createPackageJsonFile) {
                    await InstallAction_1.InstallAction.runCommand({
                        command: 'npm',
                        args: ['init'],
                    });
                }
                else {
                    InstallAction_1.InstallAction.displayMessage('A package.json file is required before initializing a kodyfire project');
                    return;
                }
            }
            const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '/';
            await InitAction.execute({ rootDir: projectRoot });
            InitAction.displayMessage('Project initialized successfully');
        }
        catch (error) {
            vscode.window.showErrorMessage(error.message);
            InstallAction_1.InstallAction.output.show();
            InstallAction_1.InstallAction.output.append(error.message);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
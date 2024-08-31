// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "image-linker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('image-linker.updloadImage', async (...args: any[]) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from image-linker!');
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			// 正则表达式匹配 Markdown 图片链接
			const markdownImageRegex = /!\[(.*?)\]\((.*?)\)/;
			const match = markdownImageRegex.exec(selectedText);

			if (match && match[2]) {
				const imagePath = decodeURIComponent(match[2]);
				const currentFilePath = editor.document.uri.fsPath;
				const currentDir = path.dirname(currentFilePath);

				// 组合得到绝对路径
				const absoluteImagePath = path.isAbsolute(imagePath) ? imagePath : path.join(currentDir, imagePath);
				// 检查文件路径是否为本地文件
				if (fs.existsSync(absoluteImagePath)) {
					try {
						const imageUrl = await uploadImageToHostingService(absoluteImagePath);
						const replacementText = `![${match[1]}](${imageUrl})`;

						editor.edit(editBuilder => {
							editBuilder.replace(selection, replacementText);
						});
					} catch (error: any) {
						vscode.window.showErrorMessage('图片上传失败: ' + error.message);
					}
				} else {
					vscode.window.showErrorMessage('选中的不是有效的本地图片路径:' + absoluteImagePath);
				}
			} else {
				vscode.window.showErrorMessage('选中的内容不是有效的 Markdown 图片链接');
			}
		}
		// 上传图片的逻辑
		// uploadImageToHosting().then(() => {
		// 	vscode.window.showInformationMessage('图片上传成功！');
		// }).catch(() => {
		// 	vscode.window.showErrorMessage('图片上传失败。');
		// });
	});

	context.subscriptions.push(disposable);
}
async function uploadImageToHostingService(imagePath: string): Promise<string> {
	// 读取插件的配置项
	const configuration = vscode.workspace.getConfiguration('imageUploader');
	const uploadUrl = configuration.get<string>('uploadUrl');
	const apiToken = configuration.get<string>('apiToken');
	const imageShowBaseURL = configuration.get<string>('imageShowBaseUrl');
	if (!uploadUrl || !apiToken || !imageShowBaseURL) {
		throw new Error('请在插件设置中配置图床服务的相关信息。');
	}
	const formData = new FormData();
	const fileBuffer = fs.readFileSync(imagePath);
	const fileName = path.basename(imagePath);
	const file = new File([fileBuffer], fileName); // 创建一个 File 对象
	formData.append('file', file);
	// return ImageShowBaseURL;
	// 在这里替换为你使用的图床服务的上传逻辑
	const response = await fetch(uploadUrl, {
		method: 'POST',
		body: formData,
		headers: {
			// 添加必要的请求头，例如 API 密钥等
			'Authorization': `Bearer ${apiToken}`, // 示例：图床服务可能需要授权
		}
	})

	if (!response.ok) {
		throw new Error(`上传失败，服务器返回状态码: ${response.status}`);
	}

	const result = await response.json() as { code: number, data: { id: number } };

	if (result && result.data) {
		return imageShowBaseURL + result.data.id;
	} else {
		throw new Error('上传失败，未返回有效的图片链接');
	}
}





// This method is called when your extension is deactivated
export function deactivate() { }

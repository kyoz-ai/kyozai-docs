# kyoz.ai

kyoz.aiは、教員とCoding Agentが作ったWeb教材を受講者へ公開するホスティング環境です。認証と永続的storageを教員・受講者modelに基づく単純でカスタマイズできないAPIとして提供し、Vibe Codingで教材を作り替えてもCourse dataと権限境界が破綻しにくいようにします。

## 開発方法

### [CLIで開発する](/cli/)

手元のWorkspaceで実装・test・buildし、ReleaseをStagingへ配置します。既存のeditor、package manager、Coding Agentをそのまま利用できます。

### [MCPで開発する](/mcp/)

ChatGPTなどのWeb UIから、GitHub上の教材をbuildしてStagingへ配置し、Browser Runで画面、console error、失敗したnetwork requestを確認できます。

## Examples

[kyoz.ai examples](https://github.com/kyoz-ai/kyozai-examples)

## Reference

- [kyozai.json](/reference/kyozai-json): build成果物とPlatformの界面
- [Platform API](/reference/platform-api): Applicationのbrowser codeから利用するAPI

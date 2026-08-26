# MCPで開発する

ChatGPTなどのWeb UI上のCoding Agentは、GitHub connectorでApplication sourceを編集・commitし、kyoz.ai connectorでそのcommitをbuildしてStagingへ配置します。kyoz.aiのBrowser Runを受講者・教員として操作し、画面とbrowser上の問題まで同じ会話で確認できます。

## 始める前に

hosted buildの対象はpublic GitHub repositoryです。Application rootには次のfileが必要です。

- [`kyozai.json`](/reference/kyozai-json)
- `test`と`build`を定義した`package.json`
- `npm ci`でdependencyを復元できるlockfile

kyoz.aiはrepository、40文字のcommit SHA、repository内のApplication rootを指定してbuildします。Coding Agentにsourceの編集・commitも任せる場合は、GitHubを操作できるconnectorを同じ会話で有効にします。既にあるcommitをbuildするだけなら、GitHub connectorは必要ありません。

kyoz.ai MCP endpoint:

```text
https://mcp.kyoz.ai/mcp
```

## Web UIへ接続する

### ChatGPT

Applicationの作成、build、Stagingへの配置にはwrite actionを使うため、ChatGPT BusinessまたはEnterprise/EduのWeb版が必要です。

ChatGPTのSettingsでDeveloper modeを有効にし、Appsの作成画面へMCP endpointを登録します。認証方式にOAuthを選んでtoolをscanするとkyoz.aiの認証画面が開きます。Passkeyでログインし、Application、Staging、Productionへのアクセスを承認してください。

詳しい画面操作と提供条件は[ChatGPTのDeveloper modeとMCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)を確認してください。

### Claude

個人で利用する場合は、`Customize` → `Connectors` → `Add custom connector`を開き、MCP endpointを登録します。TeamとEnterpriseでは、Ownerが先に`Organization settings` → `Connectors`へ登録します。

追加したconnectorで`Connect`を押すとkyoz.aiの認証画面が開きます。Passkeyでログインし、Application、Staging、Productionへのアクセスを承認してください。詳しい画面操作は[Claudeのcustom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)を確認してください。

## Applicationを作成・更新する

初めて教材を配置するときは、Coding Agentがkyoz.ai上にApplicationを作成し、指定したcommitをbuildして最初のStagingへ配置します。既存のApplicationを更新するときは、対象Applicationを選び、新しいcommitをbuildして同じStagingを更新します。

例えば、次のように依頼できます。

```text
<owner>/<repository>の<application-root>にある教材を5問のクイズへ変更してください。
変更をcommitし、そのcommitをkyoz.aiでbuildしてStagingへ配置してください。
受講者として回答し、教員画面で結果を確認した後、
私が確認するための受講者用URLと教員用URLを提示してください。
```

Coding Agentはbuildの状態とlogを取得できます。buildに失敗した場合はlogを基にsourceを修正し、新しいcommitからやり直します。

## Browser Runで確認する

Browser Runは、kyoz.aiがCoding Agentのために起動するStaging用browser sessionです。Coding Agentはtest用の受講者または教員として画面を開き、操作、screenshot、表示内容、accessibility tree、console message、JavaScript error、失敗したnetwork requestを確認します。

Coding Agentのbrowser sessionとは別に、人間が直接開く受講者用・教員用の確認URLも発行されます。

## 授業へ反映する

Stagingで確認したReleaseを授業へ反映するようCoding Agentへ指示します。対象CourseのInstructorがMCPを利用している場合だけProductionへ反映でき、反映状態も同じ会話で確認できます。

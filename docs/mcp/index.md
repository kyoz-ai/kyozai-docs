# MCPで開発する

ChatGPTなどのWeb UI上のCoding Agentは、GitHub connectorでApplication sourceを編集・commitし、kyoz.ai connectorでそのcommitをbuildしてStagingへ配置します。kyoz.aiのBrowser Runを受講者・教員として操作し、画面とbrowser上の問題まで同じ会話で確認できます。

## 始める前に

hosted buildの対象はpublic GitHub repositoryです。Application rootには次のfileが必要です。

- [`kyozai.json`](/reference/kyozai-json)
- `test`と`build`を定義した`package.json`
- `npm ci`でdependencyを復元できるlockfile

`kyozai.json`で[`build.kind`](/reference/kyozai-json#build)に`jupyterlite`を指定した場合は、`package.json`とlockfileの代わりにNotebookを置いたcontents directoryが必要です。

kyoz.aiはrepository、40文字のcommit SHA、repository内のApplication rootを指定してbuildします。Coding Agentにsourceの編集・commitも任せる場合は、GitHubを操作できるconnectorを同じ会話で有効にします。既にあるcommitをbuildするだけなら、GitHub connectorは必要ありません。

kyoz.ai MCP endpoint:

```text
https://mcp.kyoz.ai/mcp
```

## Web UIへ接続する

### ChatGPT

Applicationの作成、build、Stagingへの配置にはwrite actionを使うため、ChatGPT BusinessまたはEnterprise/EduのWeb版が必要です。

ChatGPTのSettingsでDeveloper modeを有効にし、Appsの作成画面へMCP endpointを登録します。認証方式にOAuthを選んでtoolとApplication開発Skillをscanするとkyoz.aiの認証画面が開きます。Passkeyでログインし、Application、Staging、Productionへのアクセスを承認してください。

詳しい画面操作と提供条件は[ChatGPTのDeveloper modeとMCP apps](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)を確認してください。

### Claude

個人で利用する場合は、`Customize` → `Connectors` → `Add custom connector`を開き、MCP endpointを登録します。TeamとEnterpriseでは、Ownerが先に`Organization settings` → `Connectors`へ登録します。

追加したconnectorで`Connect`を押すとkyoz.aiの認証画面が開きます。Passkeyでログインし、Application、Staging、Productionへのアクセスを承認してください。詳しい画面操作は[Claudeのcustom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)を確認してください。

### Codex

Codexに`kyozai`としてMCP endpointを登録している場合は、次のコマンドで招待発行を含む権限を認可できます。

```sh
codex mcp login kyozai --scopes application:write,staging:write,production:write,course:write
```

ブラウザで対象CourseのInstructorとしてPasskey認証し、権限を許可します。接続名が異なる場合は`kyozai`をその名前に置き換えてください。認可後も新しいツールが表示されない場合はCodexを再起動して会話を再開し、`course_invitation_create`が利用できるか確認します。[CodexのMCP設定](https://developers.openai.com/codex/mcp/)も参照してください。

接続に使ったアカウントによって利用できるApplicationは異なります。招待を発行する前に、対象ApplicationとInstanceを確認してください。

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

## 招待URLを発行する

対象CourseのInstructorは、`course_invitation_create`で受講者または教員の招待URLを発行できます。MCP接続で`course:write`（Courseの招待URL発行）へのアクセスを承認してください。以前からの接続でこの権限がない場合は、ツール情報を更新し、追加の権限を認可して接続し直します。

例えば「simple-quizに受講者用の招待URLを、累計30人まで参加できる条件で発行してください」と依頼できます。Coding Agentは`application_list`で対象を確認し、そのApplication Instance IDを使います。

```json
{
  "applicationInstanceId": "adbdvf1rgx",
  "role": "learner",
  "maxParticipants": 30
}
```

教員を招待する場合は、`role`を`instructor`にします。例えば「同じApplicationに教員用・累計2人までの招待URLを発行してください」と依頼できます。

`role`は`learner`または`instructor`です。終了条件は次の一方を指定します。

- `maxParticipants`：参加する累計人数の上限（正の整数）。期限はありません。
- `expiresAt`：タイムゾーン付きの将来日時（例：`2026-09-30T18:00:00+09:00`）。人数制限はありません。

両方の同時指定はできません。両方省略すると、CLIと同じ1人・7日間の招待になります。

結果には招待ID、Course名、Role、招待URL、期限、人数上限が返ります。URLは発行時にだけ返されるため、その場で保存してください。同じ発行操作を繰り返すと別の招待が作られます。

招待URLは対象Applicationの`/_kyozai/join?code=...`です。参加者はPasskeyでログインして参加を確定し、そのsessionでApplicationを利用できます。URLを開くだけでは参加人数に含まれません。参加人数・状態の確認と無効化は管理画面の「授業の実施 → 招待URL」で行います。

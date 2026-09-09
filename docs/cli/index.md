# CLIで開発する

手元のWorkspaceでApplicationを作り、localでtest・buildしてからkyoz.aiへ公開します。

## CLIを導入する

[kyozai-cli Releases](https://github.com/kyoz-ai/kyozai-cli/releases/latest)からOSとarchitectureに合うarchiveを取得します。`kyozai`を展開し、checksumを確認してPATH上へ置いてください。

現在のReleaseはmacOS、Linux、Windowsのamd64とarm64を提供しています。

## ログインする

```sh
kyozai login
```

CLIに表示されたURLをブラウザで開き、表示されたcodeを入力します。Passkeyでログインし、CLIによる操作を承認するとterminalへ戻ります。

## Applicationを作る

新しいdirectoryから始める場合は次を実行します。

```sh
mkdir my-course-app
cd my-course-app
kyozai app create .
```

static web applicationの雛形と、kyoz.ai上のApplication、Course、Application Instanceが作成されます。

既存のsourceを使う場合は、rootに[`kyozai.json`](/reference/kyozai-json)を置いてから実行します。

```sh
cd existing-app
kyozai app create .
```

Application IDとInstance IDは`.kyozai.json`へ保存されます。このfileはrepositoryへcommitしません。

## 実装してStagingで確認する

Applicationのtestとbuildは`package.json`で定義します。`kyozai.json`の[`build.kind`](/reference/kyozai-json#build)でkyoz.aiのbuilderを使うApplicationは、hosted buildでReleaseを作ります。

```sh
npm install
npm test
npm run build
kyozai release create
```

`kyozai release create`が表示したRelease IDをStagingへ配置します。

```sh
kyozai staging deploy <release-id>
```

同じStagingを受講者と教員で開き、画面とdataの見え方を確認します。

```sh
kyozai staging open --as learner
kyozai staging open --as instructor
```

別の受講者として確認する場合は番号を指定します。同じ番号を再度指定すると、同じ受講者として開きます。

```sh
kyozai staging open --as learner --identity 2
```

修正後は新しいReleaseを作り、同じStagingへ配置します。Stagingのdataは維持されます。

```sh
npm test
npm run build
kyozai release create
kyozai staging deploy <new-release-id>
```

Production dataからStagingを作り直すときは、現在のStagingを削除してから配置します。

```sh
kyozai staging delete
kyozai staging deploy <release-id>
```

## 授業へ反映する

確認したReleaseをProductionへ配置します。

```sh
kyozai production deploy <release-id>
```

反映が完了するとStagingは削除されます。受講者を招待する場合は、招待URLを発行して渡します。

```sh
kyozai course invite --role learner --max-participants 30
kyozai course invite --role instructor --expires-at 2026-09-30T18:00:00+09:00
```

`--max-participants` は、そのURLから参加する累計人数の上限です。期限はありません。`--expires-at` はタイムゾーンを含む将来の日時を指定し、期限内の人数制限はありません。両方を同時には指定できません。どちらも省略すると、従来どおり1回限り・7日間の招待になります。

URLは発行時にコピーして保管してください。後から同じURLを再表示できません。管理画面の「授業の実施 → 招待URL」で、参加人数・終了条件の確認と無効化ができます。無効化しても参加済みのメンバーには影響しません。

Instructorは一覧からMembership IDを確認してCourse memberのRoleを削除できます。自分のInstructor Roleと、Courseに残る最後のInstructor Roleは削除できません。Instructorが自分のLearner Roleを削除することはできます。

```sh
kyozai course members
kyozai course remove <membership-id> --role learner
```

最初のProductionだけは、Stagingがない状態でもReleaseを配置できます。

## Source archiveへ含めないfile

Releaseではsource archiveとstatic assetsを分けて扱います。`.git`、`.kyozai.json`、`artifacts.assets`のdirectoryはsource archiveから自動的に除外されます。それ以外は`.kyozaiignore`を置くと、`.gitignore`と同じ記法で除外できます。`.kyozaiignore`がなければ`.gitignore`が使われます。

Releaseへ含まれるsymbolic linkはerrorになります。

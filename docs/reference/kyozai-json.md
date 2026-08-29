# kyozai.json

`kyozai.json`は、buildされたstatic assetsとkyoz.ai Platformの界面を定義します。Applicationのsource rootへ置きます。

## Static assetsと開始path

```json
{
  "$schema": "https://kyoz.ai/schemas/application-v1.json",
  "schemaVersion": 1,
  "artifacts": {
    "assets": "dist"
  },
  "paths": {
    "learner": "/quiz.html",
    "instructor": "/dashboard.html"
  }
}
```

- `artifacts.assets`: browserへ配信するbuild成果物のdirectory
- `paths.learner`: 受講者として開くpath
- `paths.instructor`: 教員として開くpath

`artifacts.assets`は`kyozai.json`からのrelative pathです。`learner`と`instructor`は配信されるassetsのrootから始まるpathで、両方を指定します。

## Build

`build`を省略すると、`package.json`の`test`と`build`でartifactを作ります。`build.kind`を指定すると、kyoz.aiが用意したbuilderがartifactを作ります。現在は`jupyterlite`を指定できます。

```json
{
  "build": {
    "kind": "jupyterlite",
    "contents": "files",
    "static": "site",
    "hooks": "hooks.js"
  },
  "artifacts": {
    "assets": "dist/assets"
  },
  "paths": {
    "learner": "/lab/index.html",
    "instructor": "/dashboard.html"
  },
  "capabilities": ["personal-objects"],
  "egress": {
    "browser": ["https://cdn.jsdelivr.net"]
  }
}
```

- `contents`: JupyterLiteの初期contentsにするdirectory。Notebookやdata fileをsubdirectoryごと置く。受講者が初めて開いたときにPersonal Objectsへ複製され、以後は受講者ごとの内容になる
- `static`: assetsのrootへそのまま配置するdirectory。教員用画面などのHTML、CSS、JavaScriptを置く。JupyterLiteが生成するfileと同じpathは指定できない。HTML内のinline scriptはContent Security Policyで実行されないため、scriptは別fileにする
- `hooks`: Notebookの保存・削除時に呼ぶJavaScriptまたはTypeScript module。Application内のfileだけをimportできる。省略すると保存時に何も記録しない

`contents`は必須です。`static`と`hooks`は必要な場合だけ指定します。JupyterLite buildはhosted buildで実行します。`artifacts.assets`にはbuilderの出力先を指定し、`paths.learner`には`/lab/index.html`を指定します。

JupyterLite builderは、受講者のNotebookをPersonal Objectsへ保存するdriveを組み込みます。このため`capabilities`に`personal-objects`が必要です。Python packageは`https://cdn.jsdelivr.net`から取得するため、`egress.browser`にも指定します。不足している場合はbuildが失敗します。

### Hooks

`hooks`のmoduleは`saved`と`removed`をexportできます。driveはNotebookの保存・複製・checkpoint復元で`saved`を、削除で`removed`を呼びます。名前変更では元のpathで`removed`、新しいpathで`saved`を呼びます。

```js
const TABLE_URL = '/_kyozai/capabilities/database/membership/notebook_progress';

export async function saved(model) {
  if (model.type !== 'notebook') {
    return;
  }
  await record('PUT', {
    key: { path: model.path },
    values: { last_modified: model.last_modified },
  });
}

export async function removed(model) {
  if (model.type !== 'notebook') {
    return;
  }
  await record('DELETE', { key: { path: model.path } });
}

async function record(method, body) {
  const response = await fetch(TABLE_URL, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${TABLE_URL}: ${response.status}`);
  }
}
```

`model`はJupyterLabの`Contents.IModel`で、`path`、`name`、`type`(`notebook`、`file`、`directory`)、`last_modified`、`content`を持ちます。`saved`の`content`にはNotebookのJSONなど保存した内容が入り、`removed`の`content`は`null`のことがあります。directoryの操作では、directory自身とその配下のfileごとに呼ばれます。初期contentsの複製時には呼ばれません。

hookは受講者のbrowserで、その受講者の権限で実行されます。Personal ObjectsとApplication Databaseへの書き込みは、いずれもその受講者自身のscopeに限られます。

hookはPersonal Objectsへの保存・削除が完了した後に呼ばれます。hookが例外を投げるとJupyterLiteには保存の失敗として表示されますが、Personal Objectsの内容は既に更新されています。同じ`model`で再度呼ばれても結果が変わらないように、Membership scopeのupsertとdeleteのような冪等な操作で記録します。

hookと`static`に置いた教員用画面は、いずれも[Platform API](/reference/platform-api)を`fetch`で利用します。Application Databaseへ記録する場合は、`capabilities`に`application-database`を加え、`database`にmigrationとtableを定義します。

builderは初期contentsの一覧を`/kyozai/contents.json`として配信します。各要素は`path`、`type`(`notebook`、`file`、`directory`)、`format`、`mimetype`、`size`を持ち、教員用画面でNotebookの一覧を得る場合などに利用できます。

### Personal Objectsのkey

JupyterLite builderのdriveは、受講者のfileを次のkeyでPersonal Objectsへ保存します。教員画面から受講者のNotebookを読む場合はこのkeyを使います。

- `contents/<path>`: fileまたはdirectoryの`Contents.IModel`をJSONで保存する
- `checkpoints/<path>/<id>`: checkpoint
- `initial-content/1`: 初期contentsを複製済みであることを示す。存在する受講者には、Releaseを更新しても新しい初期contentsは配布されない

## Platform機能

Applicationが使う機能を`capabilities`へ指定します。

```json
{
  "capabilities": [
    "personal-objects",
    "application-database"
  ]
}
```

- `personal-objects`: MembershipごとのObjectを保存する
- `application-database`: migrationで定義したtableをCourse内で利用する

browser codeからの利用方法は[Platform API](/reference/platform-api)を参照してください。

## Application Database

```json
{
  "capabilities": ["application-database"],
  "database": {
    "migrations": ["migrations/001-progress.sql"],
    "tables": {
      "progress": {
        "scope": "membership",
        "key": ["item_id"]
      }
    }
  }
}
```

`migrations`は適用順にSQL fileを並べます。`tables`にはAPIから利用するtableとscopeを定義します。

- `membership`: Membershipごとの行。Course memberは専用APIで自身の行をupsert・deleteできる
- `course`: Course全体のtable。教員がSQL APIから利用する

`membership` scopeでは、Application内で行を識別するcolumnを`key`へ指定します。migration側のtableには`membership_id` columnを設け、`membership_id`と`key`を一意にします。

## Browser egress

Applicationが外部originへ接続する場合は、送信先をorigin単位で指定します。

```json
{
  "egress": {
    "browser": [
      "https://cdn.jsdelivr.net",
      "https://files.pythonhosted.org"
    ]
  }
}
```

指定していない外部originへのbrowser通信は失敗します。pathを含めず、`http`または`https`のoriginを指定します。

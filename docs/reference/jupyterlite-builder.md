# JupyterLite builder

`kyozai.json`の`build.kind`に`jupyterlite`を指定すると、Notebookを置いたdirectoryからJupyterLite Applicationを作ります。JupyterLite buildはhosted buildで実行します。

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

`contents`は必須です。`static`と`hooks`は必要な場合だけ指定します。`artifacts.assets`にはbuilderの出力先を指定し、`paths.learner`には`/lab/index.html`を指定します。

JupyterLite builderは、受講者のNotebookをPersonal Objectsへ保存するdriveを組み込みます。このため`capabilities`に`personal-objects`が必要です。Python packageは`https://cdn.jsdelivr.net`から取得するため、`egress.browser`にも指定します。不足している場合はbuildが失敗します。

hookと`static`に置いた教員用画面は、いずれも[Platform API](/reference/platform-api)を`fetch`で利用します。Application Databaseへ記録する場合は、`capabilities`に`application-database`を加え、`database`にmigrationとtableを定義します。

## Hooks

`hooks`のmoduleは`saved`、`removed`、`executed`をexportできます。driveはNotebookの保存・複製・checkpoint復元で`saved`を、削除で`removed`を呼びます。名前変更では元のpathで`removed`、新しいpathで`saved`を呼びます。cellの実行が終わるたびに、成否にかかわらず`executed`を呼びます。

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

`saved`と`removed`はPersonal Objectsへの保存・削除が完了した後に呼ばれます。hookが例外を投げるとJupyterLiteには保存の失敗として表示されますが、Personal Objectsの内容は既に更新されています。同じ`model`で再度呼ばれても結果が変わらないように、Membership scopeのupsertとdeleteのような冪等な操作で記録します。

`executed(model, execution)`の`model`は`saved`と同じ形で、`content`には実行直後のNotebookの内容が入ります。この内容は保存されておらず、`last_modified`は最後に保存した時刻のままです。`execution.cell`は実行したcellのnbformat JSONで、`id`、`source`、`execution_count`、`outputs`を持ちます。errorは`outputs`の`output_type: "error"`(`ename`、`evalue`、`traceback`)として入ります。`execution.success`は実行が成功したかどうかです。実行時刻は渡さないので、必要ならhookで取得します。`executed`が例外を投げてもcellの実行は失敗にならず、browserのconsoleにerrorとして残ります。

## 初期contentsの一覧

builderは初期contentsの一覧を`/kyozai/contents.json`として配信します。各要素は`path`、`type`(`notebook`、`file`、`directory`)、`format`、`mimetype`、`size`を持ち、教員用画面でNotebookの一覧を得る場合などに利用できます。

## Personal Objectsのkey

JupyterLite builderのdriveは、受講者のfileを次のkeyでPersonal Objectsへ保存します。教員画面から受講者のNotebookを読む場合はこのkeyを使います。

- `contents/<path>`: fileまたはdirectoryの`Contents.IModel`をJSONで保存する
- `checkpoints/<path>/<id>`: checkpoint
- `initial-content/1`: 初期contentsを複製済みであることを示す。存在する受講者には、Releaseを更新しても新しい初期contentsは配布されない

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

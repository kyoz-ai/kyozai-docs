# Platform API

Applicationのbrowser codeから、同一originの`/_kyozai/capabilities`以下をrelative URLで`fetch`します。APIのCourse、Membership、Environmentは現在のbrowser sessionから決まります。

Application codeは、その画面を開いた利用者に許可されたCourse内の操作を行えます。他のCourseのdataへはアクセスできません。

## Identity Context

```http
GET /_kyozai/capabilities/context
```

```ts
interface IdentityContext {
  user: { id: string; displayName: string };
  course: { id: string; title: string };
  membership: { id: string };
  roles: ('Learner' | 'TeachingAssistant' | 'Instructor')[];
  environment: { id: string; kind: 'production' | 'staging' };
  deployment: { id: string; releaseId: string };
  requestId: string;
}
```

`kyozai.json`の`capabilities`への指定は不要です。Roleは排他的な値ではなく集合です。

## Course Learners

Teaching AssistantとInstructorは、担当Courseの受講者を取得できます。

```http
GET /_kyozai/capabilities/course/learners
```

```ts
interface CourseLearner {
  membershipId: string;
  displayName: string;
}
```

`kyozai.json`の`capabilities`への指定は不要です。

## Personal Objects

`kyozai.json`の`capabilities`へ`personal-objects`を指定します。

### 自身のObject

```http
GET    /_kyozai/capabilities/personal/objects?prefix=<prefix>
GET    /_kyozai/capabilities/personal/objects/<key>
PUT    /_kyozai/capabilities/personal/objects/<key>
DELETE /_kyozai/capabilities/personal/objects/<key>
```

Objectは`(Environment, Membership, Key)`で識別されます。ApplicationはKeyだけを指定し、Membership IDをKeyへ含めません。

一覧は次の要素を持つ配列を返します。

```ts
interface PersonalObjectInfo {
  key: string;
  size: number;
  uploaded: string;
}
```

`PUT`には任意のbodyを送れます。取得時は保存した`Content-Type`と`Content-Disposition: attachment`を持つbodyを返します。保存と削除の成功responseは`204`です。

### Course内の受講者のObject

Teaching AssistantとInstructorは、Course Learnersで取得したMembership IDを指定します。

```http
GET    /_kyozai/capabilities/course/learners/<membership-id>/personal/objects?prefix=<prefix>
GET    /_kyozai/capabilities/course/learners/<membership-id>/personal/objects/<key>
PUT    /_kyozai/capabilities/course/learners/<membership-id>/personal/objects/<key>
DELETE /_kyozai/capabilities/course/learners/<membership-id>/personal/objects/<key>
```

対象は担当Courseの受講者に限定され、操作はauditへ記録されます。

## Application Database

`kyozai.json`の`capabilities`へ`application-database`を指定し、migrationとtable scopeを定義します。

### 受講者のMembership scope

受講者は`membership` scopeのtableで自身の行をupsertまたはdeleteできます。

```http
PUT    /_kyozai/capabilities/database/membership/<table>
DELETE /_kyozai/capabilities/database/membership/<table>
```

PUT body:

```json
{
  "key": { "item_id": "lesson-1" },
  "values": { "status": "completed", "score": 8 }
}
```

DELETE body:

```json
{
  "key": { "item_id": "lesson-1" }
}
```

`key`はmanifestに指定したcolumnと一致させます。`values`にはkey columnと`membership_id`を含めません。Platformが現在のMembership IDを付与し、成功時は`204`を返します。

### Course-level SQL

Teaching AssistantとInstructorはparameter付きSQLを実行し、Course scopeとMembership scopeのtableを検索・変更できます。

```http
POST /_kyozai/capabilities/database/sql
Content-Type: application/json
```

```json
{
  "sql": "SELECT membership_id, status FROM progress WHERE item_id = ?",
  "params": ["lesson-1"]
}
```

SELECTのresponseは`results`に行を返します。SQL実行はauditへ記録されます。受講者はSQL APIを利用できません。

受講者がPersonal Objectを保存するApplicationで教員向けの一覧・集計も必要な場合は、保存時に検索・集計用の状態をMembership scopeのtableへupsertします。教員画面はそのtableをSQLでqueryするため、Object本体をすべて取得して再集計せずに済みます。

## fetchの例

```js
const response = await fetch('/_kyozai/capabilities/context');
if (!response.ok) {
  throw new Error(`context: ${response.status}`);
}
const context = await response.json();
```

pathへ埋め込むKey、table名、Membership IDは`encodeURIComponent`でencodeします。Responseが成功しなければApplicationの処理失敗として扱います。

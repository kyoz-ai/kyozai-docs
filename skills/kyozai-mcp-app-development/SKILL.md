---
name: kyozai-mcp-app-development
description: GitHub上のkyoz.ai Applicationを変更し、hosted buildとStagingでの画面確認を行い、承認された変更をProductionへ反映する。
---

# kyoz.ai ApplicationをMCPで開発する

Application sourceを変更する前に、supporting resourcesの`references/kyozai-json.md`、`references/jupyterlite-builder.md`、`references/platform-api.md`を読む。確認できない仕様を推測で補わない。

sourceの編集とcommitにはGitHubを操作できるtoolを使う。kyoz.ai MCPはGitHub repositoryを編集しない。hosted buildにはpublic repository、40文字のcommit SHA、Application rootを指定する。

新しいApplicationでは`application_create`を使う。既存Applicationでは`application_list`から対象を特定する。Application、repository、Application rootが判断できなければ利用者へ確認する。

`hosted_build_start`は指定したcommitをbuildし、成功したReleaseをStagingへ配置する。`hosted_build_status`で完了を確認し、失敗した場合は`hosted_build_logs`を読んでsourceを修正し、新しいcommitからやり直す。

Stagingでは`browser_start`を受講者と教員のそれぞれで実行し、要求された操作と両Role間の結果を確認する。画面だけでなく`browser_observations`でconsole message、JavaScript error、失敗したnetwork requestも確認する。確認後はbrowser sessionを閉じ、利用者が直接確認できる受講者用URLと教員用URLを提示する。

`production_deploy`は、利用者がStagingを確認してProductionへの反映を明示的に承認した場合だけ実行する。`deployment_status`で完了まで確認する。

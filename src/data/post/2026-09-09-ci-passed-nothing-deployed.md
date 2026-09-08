---
publishDate: 2026-09-09T00:40:00Z
title: 워크플로는 초록불인데 사이트에는 아무것도 없었다
excerpt: Astro로 만든 블로그를 Cloudflare에 올리면서 네 번 막혔다. 마지막 하나는 내가 직접 만든 함정이었다.
category: 기술
tags:
  - Cloudflare
  - GitHub Actions
  - Astro
draft: false
---

지금 이 블로그를 Cloudflare에 올리는 데 네 번 막혔다. 앞의 셋은 남이 만든 제약이었고, 마지막 하나는 내가 만든 것이었다.

## 대시보드가 GitHub 연동을 계속 거부했다

Cloudflare 대시보드에서 GitHub 저장소를 연결하려는데 **"Error connecting to git account"**만 반복해서 떴다. GitHub 쪽에서는 Cloudflare 앱이 정상 설치된 것으로 보였고, 저장소 접근 권한도 열려 있었다.

원인을 더 파는 대신 다른 길을 택했다. Cloudflare가 GitHub를 보러 오게 하는 대신, **GitHub Actions가 빌드해서 Cloudflare에 밀어 넣도록** 바꿨다. API 토큰만 있으면 되고 대시보드 연동이 필요 없다.

결과적으로 이게 더 나았다. 배포 과정이 저장소 안의 파일 하나에 다 적혀 있어서, 무엇이 어떤 순서로 도는지 대시보드를 열어보지 않아도 안다.

## npm 11이 wrangler를 반만 설치했다

`npm ci`는 성공하는데 wrangler가 동작하지 않았다.

npm 11부터 패키지의 install 스크립트가 기본으로 차단된다. wrangler는 `workerd`라는 런타임 바이너리를 install 스크립트에서 내려받는데, 그 단계가 건너뛰어지면서 **패키지는 설치됐지만 실행에 필요한 것이 없는 상태**가 됐다. 설치가 성공했다고 나오니 원인을 찾는 데 시간이 걸렸다.

`package.json`에 이렇게 허용했다.

```json
"allowScripts": ["workerd"]
```

이름을 하나씩 적어야 한다. 전체를 열면 의존성 트리의 모든 패키지가 설치 중에 임의 스크립트를 돌릴 수 있게 된다.

## 커스텀 도메인 때문에 Workers에서 Pages로 옮겼다

처음엔 Cloudflare Workers에 올렸다. 배포는 됐고 Cloudflare가 만들어준 `무작위이름.workers.dev` 주소로 접속도 됐다. 그런데 `blog.study-about.club`을 붙이려니 이렇게 나왔다.

```
No zones match blog.about20s.club
```

**Workers에 커스텀 도메인을 붙이려면 그 도메인의 DNS를 Cloudflare가 관리하고 있어야 한다.** 서브도메인 하나 붙이자고 실서비스 도메인의 네임서버를 통째로 옮기는 건 위험 대비 이득이 맞지 않았다. 네임서버를 옮기는 동안 문제가 생기면 블로그가 아니라 서비스가 멈춘다.

Pages는 다르다. 서브도메인이면 zone 없이 **외부 DNS에 CNAME 하나만 추가하면** 연결된다. 도메인 등록업체(고대디)에 CNAME을 넣고 끝났다.

옮기는 김에 도메인도 `about20s.club`에서 `study-about.club`으로 바꿨다. 앞의 것이 뒤의 것으로 301 리다이렉트되고 있어서 실제 트래픽과 검색 순위가 모두 뒤쪽에 쌓여 있었다. 블로그를 붙이면서 얻는 효과도 그쪽이 크다.

## 초록불인데 사이트에는 아무것도 없었다

`wrangler pages deploy`는 Pages 프로젝트가 미리 만들어져 있어야 동작한다. 없으면 실패한다. 대시보드에서 손으로 만들 수도 있지만, 앞서 GitHub 연동에서 막힌 게 대시보드였기 때문에 워크플로에서 처리하기로 했다.

문제는 **프로젝트가 이미 있을 때도 생성 명령이 실패한다**는 것이다. 두 번째 배포부터는 항상 에러가 난다. 그래서 이렇게 넣었다.

```yaml
- name: Create Pages project
  continue-on-error: true      # ← 여기
  run: npx wrangler pages project create blog --production-branch=main
```

`continue-on-error: true`는 이 스텝이 실패해도 워크플로를 계속 진행시킨다. "이미 있으면 나는 에러니까 무시하자"는 생각이었다.

워크플로가 성공으로 떴다. 그래도 사이트를 열어봤다. 아무것도 없었다.

커밋 기록을 보면 저 옵션을 넣고 6분 뒤다. **API 토큰에 Pages 권한이 없었다.**

Cloudflare 대시보드에서 토큰을 만들 때 "Edit Cloudflare Workers" 템플릿을 골랐는데, 이름과 달리 이 템플릿에는 **Pages 권한이 들어 있지 않다.** 그래서 프로젝트 생성이 권한 부족으로 실패했고, 프로젝트가 없으니 그다음 배포 스텝도 실패했다.

그런데 GitHub Actions에는 초록색 체크가 떴다. 첫 스텝이 `continue-on-error`로 넘어갔기 때문이다. **내가 무시하라고 지정한 건 "이미 존재함" 하나였는데, 실제로는 그 스텝의 모든 실패를 무시하게 만들었다.**

이렇게 고쳤다.

```yaml
- name: Ensure Pages project exists
  run: |
    set -o pipefail
    if npx wrangler pages project create blog --production-branch=main 2>&1 | tee /tmp/create.log; then
      echo "프로젝트를 생성했다."
    elif grep -qiE "already exists|8000007" /tmp/create.log; then
      echo "프로젝트가 이미 존재한다. 계속 진행한다."
    else
      echo "::error::프로젝트 생성 실패 — API 토큰에 Cloudflare Pages:Edit 권한이 있는지 확인할 것"
      exit 1
    fi
```

통과시킬 실패를 **로그 내용으로 특정**한다. "이미 존재함"이면 넘어가고, 나머지는 워크플로를 세운다. 그리고 세울 때 무엇을 확인해야 하는지 로그에 적어둔다. 몇 달 뒤에 이 에러를 다시 만나면 그때의 나는 이 맥락을 기억하지 못한다.

토큰은 커스텀으로 다시 만들어 `Cloudflare Pages: Edit` 권한을 직접 넣었다.

## 배운 것

`continue-on-error`는 스텝 단위로만 걸린다. **"이 실패는 괜찮다"가 아니라 "이 스텝에서 뭐가 나든 괜찮다"는 뜻이다.** 예상한 실패 하나를 넘기려고 걸면, 예상하지 못한 실패도 같이 넘어간다. 그리고 예상하지 못한 실패야말로 알아야 하는 쪽이다.

CI가 초록색이라는 건 워크플로가 끝까지 돌았다는 뜻이지 결과물이 나갔다는 뜻이 아니다. 배포 워크플로라면 **정말 배포됐는지 확인하는 단계**가 마지막에 있어야 한다. 이번에 6분 만에 잡은 건 초록불을 안 믿고 사이트를 열어봤기 때문이다. 사람이 매번 그럴 거라고 기대할 수는 없으니, 배포된 페이지에 실제로 접속해보는 스텝을 워크플로 끝에 붙이는 게 다음 할 일이다.

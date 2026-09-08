---
publishDate: 2026-09-08T23:30:00Z
title: 올릴 수 있는 것과 올려도 되는 것
excerpt: Node 20 EOL을 계기로 런타임부터 올렸다. 열어보니 동작한 적 없는 설정들이 나왔고, 못 올릴 것들은 서로 묶여 있었다.
category: 기술
tags:
  - Next.js
  - Node.js
  - 마이그레이션
draft: true
---

`package.json`의 `engines`는 이랬다.

```json
"engines": {
  "node": "20.11.0",
  "npm": "10.2.4"
}
```

패치 버전까지 박혀 있었다. Next 14.1.0, Storybook 8.0.10. 2년 6개월 동안 만드는 데 시간을 다 썼으니 도구도 그때 그대로였다.

Node 20은 2026년 3월 24일에 EOL이 됐다. 시작 지점은 정해져 있었다.

순서는 밑에서부터 잡았다. 런타임, 프레임워크, 도구. 위에서부터 올리면 아래가 못 받쳐서 되돌아온다. 그래서 Next도 한 번에 15로 보내지 않고 14.2.16에서 14.2.35로 먼저 옮긴 다음 런타임을 바꿨다. Next 14.2를 Node 21 이상에서 구동할 때 보고된 이슈가 있었다. 두 개를 동시에 흔들면 뭐가 깨졌는지 모르게 된다.

## 열어보니 설정이 사실과 달랐다

| 설정 | 적혀 있던 것 | 실제 |
|---|---|---|
| `next-pwa` | PWA 활성 | `disable: typeof window === "undefined" \|\| !isProduction`. config는 Node에서 평가되므로 앞 조건이 **항상 참**이다 |
| `.storybook/main.ts` | addon 6개 | 그중 **어느 것도** `package.json`에 없었다. Storybook은 실행되지 않았다 |
| `dev` 스크립트 | `set NODE_OPTIONS=--openssl-legacy-provider && next dev` | webpack 4 시절 잔재. `set`은 Windows 전용이라 macOS·Linux에서는 실행이 안 됐다 |
| `packageManager` | `yarn@1.22.22` | lockfile은 `package-lock.json`이고 Dockerfile도 npm을 쓴다 |
| CI `chromatic.yml` | `- run: yarn` | `yarn.lock`이 없다. Node 버전 지정도 없어 러너 기본값으로 돌았다 |

`next-pwa`가 가장 오래 붙잡았다. `manifest.json`이 없고 `public/worker.js`를 등록하는 코드도 0건이었다. **PWA는 켜져 있던 적이 없다.** 그런데 이 저장소를 여는 사람은 설정을 보고 동작한다고 읽는다.

그래서 지웠다. 안 쓰는 걸 지운 게 아니라, **동작하지 않으면서 동작하는 척하던 걸** 지웠다.

## 계획은 세 단계였는데 두 단계가 됐다

Node, Next, Storybook을 나눠 올릴 생각이었다. 안 됐다.

`@storybook/nextjs@8.4.1`의 peer가 `next ^13.5 || ^14`다. **Storybook 8이 깔려 있는 한 Next 15가 설치되지 않는다.** ERESOLVE가 세 번 났고, peer 그래프가 8 계열 전체에 걸려 있어 부분 해결이 성립하지 않았다. 전부 지우고 9를 새로 깔았다.

`@storybook/test`는 코어로 들어가 `storybook/test`가 됐고, essentials와 interactions도 통합돼 없어서 못 돌던 addon 6개 중 4개는 설치 대상 자체가 사라졌다. `@chakra-ui/storybook-addon`은 SB9에서 삭제된 `@storybook/types`에 peer를 걸고 있어 설치가 안 된다. 같은 일을 decorator로 직접 했다.

```tsx
// .storybook/preview.tsx
decorators: [
  (Story) => (
    <ChakraProvider theme={theme}>
      <Story />
    </ChakraProvider>
  ),
],
```

`eslint-config-next` 15가 `eslint-plugin-react-hooks`를 5로 올리면서 `SwiperCore.use([Autoplay, Scrollbar])`를 훅 호출로 잡기 시작했다. 12곳이었다. swiper 11.1.14에는 `static use(modules)`가 실재한다. 유효한 API고 훅이 아니다. **코드를 고치지 않고 룰 쪽에 사유를 적었다.**

```
// eslint-disable-next-line react-hooks/rules-of-hooks -- Swiper의 static 메서드이며 React Hook이 아니다 (react-hooks v5 오탐)
```

린터가 12곳에 빨간 줄을 그었고, 그대로 믿고 고쳤으면 멀쩡히 돌던 슬라이더 12개를 망가뜨렸을 것이다. 무엇이 진짜 문제이고 무엇이 오탐인지는 도구가 알려주지 않는다.

## 올리지 않기로 한 것

여기가 이 작업에서 가장 오래 붙잡은 곳이다.

React 19는 올리고 싶었다. 이미 안정 버전이고, Next 15가 기본으로 미는 조합이고, 무엇보다 상태 관리에 쓰는 recoil은 유지보수가 멈춘 지 오래다. 미룰수록 비용이 커지는 쪽이라는 것도 알고 있었다.

그래서 세어봤다.

| 남긴 것 | 근거 | 풀면 딸려오는 것 |
|---|---|---|
| React **18.3.1** | Next 15 Pages Router가 React 18을 공식 지원한다 (peer `react ^18.2.0 \|\| ^19.0.0`) | Chakra 2→3 **547파일**, styled-components 5→6 **293파일**, react-query v3 **88파일**, recoil 제거 **68파일** |
| mongodb **v5** | `@next-auth/mongodb-adapter@1.1.3`의 peer가 `mongodb: ^5 \|\| ^4` | `@auth/mongodb-adapter`로 교체 → next-auth v4에서 Auth.js v5로 **119파일**, `useSession` **95곳** |
| Pages Router | Next 15가 계속 지원한다 | App Router 전환은 별개 결정이다 |

React 19를 올린다는 건 첫 줄을 통째로 하겠다는 결정이다. 단독으로 올릴 수 있는 항목이 아니다. **올릴 수 있는 것과 올려도 되는 것은 다르고, 그 차이는 세어봐야 나온다.**

mongoose 8이 내부적으로 mongodb 6을 번들해 드라이버가 이중으로 존재한다. 알고 있고, 정상 동작하므로 그대로 뒀다. **아는데 안 고친 것과 모르는 것은 다르다.**

이 숫자들은 저장소의 `CLAUDE.md`에 적어뒀다. 다음에 여기 오는 사람이 — 그게 나여도 — 다시 세지 않도록.

## 테스트가 0개인 저장소에서 무엇을 근거로 삼았나

가진 게 뭔지 정확히 적으면 이렇다. 테스트 러너가 없다. `next.config.js`에 `eslint: { ignoreDuringBuilds: true }`가 있어 **lint는 빌드를 막지 않는다.** Storybook과 Chromatic이 커버하는 건 `stories/atoms/` 아래 9개 파일뿐이다.

이 상태에서 "테스트가 통과했으니 안전하다"고 말할 수는 없다. 그래서 대신 밟은 것들이다.

`node_modules`를 지우고 `npm ci`로 다시 깐 뒤 `tsc --noEmit` → `next build`(정적 페이지 156개) → `next start`. 여덟 개 라우트가 전부 200을 주는지, `middleware`의 쿠키 분기와 styled-components의 SSR 스타일 추출이 정상인지 확인했다. 인증은 게스트 로그인으로 한 사이클을 끝까지 밟았다 — 세션 발급, 인증이 필요한 페이지, 관리자 페이지가 막히는지, 로그아웃.

Apple 로그인은 따로 봤다. `generateClientSecret()`이 매 요청마다 `jsonwebtoken`으로 ES256 JWT를 런타임 서명한다. **Node 메이저 업그레이드에서 OpenSSL 동작 변화의 영향을 받을 수 있는 유일한 지점**이라 최우선으로 뒀다. 정상이었다. Linux 검증은 GitHub Actions가 ubuntu에서 Node 24로 `npm ci`를 돌아 대신했다.

근거는 커버리지가 아니라 목록이었다. **이 앱에서 런타임이 바뀌면 어디가 먼저 깨지는지 지목할 수 있었고, 그 지점을 하나씩 밟았다.** 테스트가 있었다면 이 목록을 대신 세워줬을 것이다. 없으니 직접 세웠다.

## 확인하지 못한 것

**컨테이너 안에서의 `next build`는 확인하지 못했다.** 로컬에 Docker가 없었다. CodeBuild 로그로 확인했고, 빌드가 실패하면 ECR push 전에 멈추는 구조라는 걸 근거로 진행했다. 커밋 메시지에 "미검증"으로 적어뒀다 — 나중에 이 커밋을 여는 사람이 검증된 것과 아닌 것을 구분할 수 있어야 한다.

Chromatic에는 Storybook 8과 9의 렌더링 차이가 남아 있다. 앱 동작이 아니라 스토리 렌더링 쪽이라 배포를 막을 사안은 아니라고 보고 뒤로 미뤘다.

## 다음 순서

옮긴 건 런타임(Node 24.20.0), 프레임워크(Next 15.5.25), 도구(Storybook 9.1.20)다. 앱 코드는 거의 건드리지 않았다. 첫 글에 정리하겠다고 써놓고 처음 한 게 이거였다.

다음은 React 19고, 그러면 Chakra 3와 styled-components 6, recoil 대체가 함께 온다. 그 뒤가 Auth.js다. 한 번에 하지 않는 이유는 위에서 이미 세어뒀다.

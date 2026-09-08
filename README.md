# blog.study-about.club

[ABOUT](https://study-about.club) 서비스를 만들고 운영하며 겪은 문제와 판단을 기록하는 개발 블로그.

- 사이트: https://blog.study-about.club
- 글을 쓰고 고치는 규칙: [`CLAUDE.md`](CLAUDE.md)

## 스택

Astro 7 (`output: 'static'`) + Tailwind 4. 테마는 [AstroWind](https://github.com/onwidget/astrowind)를 가져와 블로그만 남기고 정리했다. 폰트는 Pretendard.

## 명령어

```bash
nvm use            # .nvmrc = Node 24.20.0
npm ci
npm run dev        # localhost:4321
npm run build      # dist/ 생성
npm run preview
npx astro check    # 타입 체크
```

캐시 때문에 삭제한 글이 계속 보이면 `rm -rf node_modules/.astro .astro dist` 후 다시 빌드한다.

## 글 쓰기

`src/data/post/`에 마크다운 파일 하나를 추가하는 것이 전부다. 목록·태그·카테고리 페이지, RSS, sitemap, canonical URL은 빌드할 때 자동으로 만들어진다.

```yaml
---
publishDate: 2026-09-09T00:00:00Z   # 필수로 취급
title: 제목                          # 스키마상 유일한 필수 필드
excerpt: 목록·검색·글 상단에 함께 노출된다   # 필수로 취급
category: 기술
tags:
  - Astro
draft: true                          # true면 빌드 결과에서 제외
---
```

URL은 파일명으로 정해진다(`/posts/<파일명>`). **발행한 뒤에는 파일명을 바꾸지 않는다.**

## 배포

`main`에 push하면 [GitHub Actions](.github/workflows/deploy.yml)가 빌드해서 Cloudflare Pages로 올린다. 30~60초 걸린다.

서비스 저장소와 배포 파이프라인이 분리되어 있다. 글 하나 고치자고 서비스 빌드를 태우지 않기 위해서다.

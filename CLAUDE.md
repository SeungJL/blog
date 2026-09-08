# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 저장소는 `blog.about20s.club` — ABOUT 서비스를 만들고 운영하는 이승주(Founder & Product Engineer)의 개발 블로그다. Astro 7 기반 정적 사이트.

Astro 관련 기본 안내는 `AGENTS.md`를 참고한다(이 파일과 별개, 심볼릭 링크 아님).

## 명령어

```bash
npm run dev       # localhost:4321
npm run build     # dist/ 생성. description 누락 등 스키마 위반 시 실패한다
npm run preview
npx astro check   # 타입 체크
```

캐시 문제로 삭제한 글이 계속 나타나면 `rm -rf node_modules/.astro .astro dist` 후 재빌드한다.

## 글 작성

`src/content/posts/`에 마크다운 파일 하나를 추가하는 것이 유일한 반복 작업이다. 나머지(RSS, sitemap, OG 이미지, 목록, canonical)는 빌드 시 자동 생성된다.

frontmatter 스키마 (`src/content.config.ts`):
```yaml
title: string        # 필수
description: string  # 필수 — 없으면 빌드 실패. 검색 결과·OG 카드에 노출됨
pubDate: date         # 필수
updatedDate: date     # 선택
tags: string[]        # 선택, 기본 []
draft: boolean        # 선택, 기본 false — true면 `npm run build`(PROD) 결과에서 제외
```

### 작성 워크플로

1. 소재를 정하면 Claude가 사실·숫자·구조·코드 인용 위주로 초안을 작성해 `draft: true`로 커밋한다.
2. 사용자가 본문에 `<!-- ME: ... -->` 형태로 느낀 점·맥락을 다듬지 않고 삽입한다.
3. Claude가 그 조각을 문맥에 녹여 최종안을 만들고 `<!-- ME: -->` 마커를 제거한다.
4. `draft: false`로 바꾸고 push한다.

**Claude가 지어내면 안 되는 것: 저자가 무엇을 느꼈는지, 왜 이 작업을 이 시점에 했는지, 팀에 어떻게 설명했는지.** 이런 맥락은 반드시 `<!-- ME: -->`로 받은 내용에서만 가져온다.

## 문체

- **평서체** (`~했다`, `~이다`). 존댓말 쓰지 않는다.
- **독자는 실무 개발자.** `peer dependency`, `lockfile`, `SSR` 같은 용어를 설명 없이 쓴다.
- **1인칭은 최소화.** "나는"보다 "이 프로젝트는", "측정해보니"처럼 대상·행위 중심으로 쓴다.
- **길이는 소재에 맞춘다.** 채우려고 늘리지 않는다.

### 구조

```
1. 상황과 제약   — 첫 문단에 숫자로. "1,086파일 / 11만 줄 / 테스트 0개"
2. 처음 가정한 것 — 그리고 왜 틀렸는지
3. 실제로 측정한 것 — 표로. 이게 글의 자산이다
4. 판단과 근거   — 왜 A를 택하고 B를 버렸는가
5. 틀린 것 / 못 한 것 — 생략하지 않는다. 여기서 신뢰가 생긴다
6. 결과          — 전후 비교, 남은 것
```

### 절대 쓰지 않는 표현 (AI 티 나는 패턴)

- "안녕하세요, 오늘은 ~에 대해 알아보겠습니다" 류의 서론
- "도움이 되셨길 바랍니다" 류의 맺음 인사
- 글 서두에 목차를 나열
- 근거 없는 강조어 ("놀랍게도", "충격적이게도")
- 불릿으로만 채운 문단 — 설명은 문장으로, 불릿은 순수 나열에만
- "결론부터 말씀드리면"의 남발

### 사실 규칙

- 숫자는 실측치만 쓴다. 어림값이면 "약"을 붙인다.
- 코드를 인용할 때는 실제 파일 경로를 명시한다.
- 확인하지 않은 것은 "확인하지 않았다"고 명시한다. 추측을 단정으로 쓰지 않는다.

## 마스킹 필수 (About 저장소 내용을 인용할 때)

- AWS 계정 ID, ECR 전체 경로 → `<account-id>`로 대체
- FontAwesome / Chromatic 토큰 값 — 절대 노출하지 않는다
- EC2 서버 경로, Secrets Manager 시크릿 이름
- `scripts/deploy.sh` 전문 — 롤백 취약점이 그대로 드러난다

## 아키텍처 메모

- `astro.config.mjs`의 `site` 값(`https://blog.about20s.club`)이 sitemap·RSS·canonical의 기준이다. 도메인을 바꾸면 여기부터 바꾼다.
- `src/content.config.ts`는 Astro 7 API를 쓴다 (`src/content/config.ts` 아님, `glob` loader, `render()` — 구버전의 `entry.render()`가 아니다).
- 스타일은 Tailwind 없이 `src/styles/global.css` 하나로 관리한다. 이 규모에서 유틸리티 프레임워크는 비용 대비 이득이 없다.
- 서비스(`study-about.club`)와 별도 배포 파이프라인이다. 글 하나 고치자고 About의 CodeBuild를 태우지 않기 위한 의도적 분리다.

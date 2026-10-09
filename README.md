# Game Asset Library

게임 만들 때 **검색해서 URL로 바로 쓰는 무료(CC0 중심) 에셋 라이브러리**.
사이트: https://hakyong-tae.github.io/game-asset-library/

| | |
|---|---|
| 팩 | 523 |
| 파일 | 105,615 |
| 용량 | 허브 826 MB + 3D 810 MB |

## 쓰는 법
1. 사이트에서 검색 → 팩을 고르고 미리보기 → 「복사」로 id 한 줄 → AI에게 "이 팩으로 ○○ 만들어줘".
2. **프로젝트마다 한 번**: 사이트 상단 「AI에 연결하기」를 눌러 복사한 프롬프트를 프로젝트 규칙 파일(CLAUDE.md / AGENTS.md 등)에 붙인다. 그 뒤로는 id 만 말하면 된다. ([AI-GUIDE.md](AI-GUIDE.md))
3. 프로젝트로 가져오기(배포용):
```bash
curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - search "sword" --type 3d
curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - get kenney/ui-pack public/assets/ui --credits CREDITS.md
```
4. 브라우저에서 바로(프로토타입): `<script src="https://hakyong-tae.github.io/game-asset-library/loader.js"></script>` → `AssetLib.load()`.

## 구성
저장소가 둘로 나뉘어 있다(GitHub Pages 1GB 한도). 사이트·목록은 허브 한 곳에서 둘을 모두 색인한다.
- **허브** `hakyong-tae/game-asset-library` — 2D 스프라이트·UI, 오디오, 아이콘, 팔레트 + 사이트/매니페스트
- **3D** `hakyong-tae/game-asset-library-3d` — 3D 모델(GLB/FBX), 텍스처, HDRI (https://hakyong-tae.github.io/game-asset-library-3d/)

출처: Kenney 전 팩 · Quaternius · KayKit · Poly Haven · OpenGameArt(CC0만) · itch.io(CC0 명시 팩만) · game-icons.net(CC BY 3.0) · Lospec 팔레트 · Superpowers.
각 팩의 라이선스 증거는 `packs.json`의 `evidence`, 원문 링크는 `origin`.

## 라이선스
[LICENSES.md](LICENSES.md) — 대부분 CC0(표기 불필요). game-icons.net 만 CC BY 3.0(표기 필수).

> 용량 때문에 빠진 큰 팩(6개, 로컬 전체 라이브러리에는 있음): universal-base-characters, modular-character-outfits-fantasy, fantasy-props-megakit, medieval-village-megakit, sci-fi-essentials-kit, downtown-city-megakit

## 직접 다시 만들기
수집·선별 도구는 `tools/`(수집 스크립트는 로컬 전체 라이브러리 쪽에 있음). 이 저장소는 그 결과물의 웹용 판본이다 — 큰 팩은 용량 때문에 빠져 있다.

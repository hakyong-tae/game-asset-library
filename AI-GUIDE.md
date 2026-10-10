이 에셋 라이브러리를 이 프로젝트에서 쓸 수 있게 붙여줘.
파일을 미리 다 받지 않는다 — 필요한 것만 아래 주소에서 읽거나 가져온다.

베이스(허브): https://hakyong-tae.github.io/game-asset-library/
  packs.json   팩 목록 — 항목마다 id, name, type(2d|3d|audio|texture|icon|hdri|palette), license(CC0|CC BY 3.0),
               author, origin, tags, volume, path, files, bytes, formats
  search.json  파일 이름 색인 { ids:[팩 id...], e:[[팩 인덱스, 소문자 파일명], ...] }
  files/<id의 '/'를 '__'로>.json   팩 안의 파일 목록 [[상대경로, 바이트], ...]
  파일 URL = (volume의 base) + path + 상대경로
    volume main = https://hakyong-tae.github.io/game-asset-library/      (2D·오디오·아이콘·팔레트)
    volume 3d   = https://hakyong-tae.github.io/game-asset-library-3d/   (3D 모델·텍스처·HDRI)
  예: https://hakyong-tae.github.io/game-asset-library/packs/kenney/1-bit-pack/Preview.png

찾기
  사람   사이트에서 검색한 뒤 이름 옆 「복사」로 id 한 줄을 가져온다.
  AI     curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - search "<키워드>" [--type 3d]
         (팩 이름·태그와 파일 이름을 같이 검색한다. Node 18+ 필요)

프로젝트로 가져오기 — 배포용은 반드시 이 방법
  curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - get <id> public/assets/<폴더> --credits CREDITS.md
  필요한 파일만: --only png,glb  /  --filter <경로 일부>
  → 파일 복사 + .asset-source.json + CREDITS.md 에 출처 한 줄 추가

바로 읽기(프로토타입)
  <script src="https://hakyong-tae.github.io/game-asset-library/loader.js"></script>
  const lib = await AssetLib.load();
  lib.search('hexagon', { type: '3d' });          // 팩 검색
  await lib.searchFiles('sword');                 // 파일 이름 검색
  lib.url('kenney/1-bit-pack', 'Preview.png');   // 파일 URL
  await lib.files('<id>');                        // 팩 안 파일 목록
  lib.credits(['<id>', ...]);                     // CREDITS 마크다운

도구·스킬 목록(게임 에셋 아님)
  https://hakyong-tae.github.io/game-asset-library/tools.json — 영상·모션 제작용 도구/스킬 20개(Remotion, HyperFrames, GSAP, Lottie 등). 링크·라이선스 메모만 있고 코드는 복사하지 않는다.
  각 항목에 kinds 태그: ai-skill(AI에게 설치해 쓰는 스킬 — SKILL.md 포함) / library(코드에서 import 하는 라이브러리·엔진) / list(목록).
  AI 스킬은 설치 전에 SKILL.md 를 읽어 내용을 확인하고, 설치(npx skills add 등)는 사용자 허락을 받은 뒤에 한다. 찾기: use.mjs search <키워드> --type tool --kind skill
  ⚠ Remotion 은 직원 4명 이상 영리 조직이면 유료 라이선스가 필요하다 — 회사 업무에는 라이선스 확인 전까지 HyperFrames(Apache-2.0) 쪽을 우선 고려.

규칙
  1. 라이선스: CC0 는 표기 불필요. CC BY(game-icons.net)는 CREDITS.md 에 작가 표기 필수.
  2. 서비스(배포)하는 게임은 필요한 파일만 프로젝트로 복사해 번들한다. GitHub Pages 직링크로 서비스하지 않는다.
  3. 쓴 팩은 CREDITS.md 에 id·작가·출처 URL·라이선스를 남긴다(get --credits 가 자동으로 적는다).
  4. 3D: GLB 우선. GLB 없는 팩은 FBX(애니메이션 포함) 또는 OBJ. Three.js 는 GLTFLoader / FBXLoader / OBJLoader.
  5. 오디오는 ogg(vorbis) 또는 mp3. 2D 스프라이트시트는 xml/json 아틀라스가 함께 있으면 그대로 쓴다.
  6. 라이브러리에 없는 에셋이 필요하면 만들어 쓰지 말고 먼저 search 로 찾아본다.

연결된 외부 라이브러리 — 이 저장소에 파일을 복사해 두지 않고 링크만 한다(파일은 원작자 사이트에서 직접 읽음)
  나인크로니클 (주정민) — https://jujeongmin.github.io/effect-character-library/
    nc/effects  이펙트 스프라이트 — 매니페스트 https://jujeongmin.github.io/effect-character-library/effects.json  (assets[]: id, file, frameWidth, frameHeight, frames, cols, rows, fps, category)
    nc/characters  캐릭터 — 매니페스트 https://jujeongmin.github.io/effect-character-library/characters.json  (assets[]: id, name, category, animations.default.file)
    nc/icons  아이콘 — 매니페스트 https://jujeongmin.github.io/effect-character-library/icons.json  (assets[]: id, name, category, animations.default.file)
    이미지 URL = https://jujeongmin.github.io/effect-character-library/ + file
    이펙트 로더: https://jujeongmin.github.io/effect-character-library/loader.js  →  const lib = await EffectLib.load('https://jujeongmin.github.io/effect-character-library/effects.json'); await lib.preload(['<id>']); const fx = lib.play('<id>', { loop: false }); fx.update().draw(ctx, x, y, { scale: 1 });
    찾기/가져오기는 위와 같다: use.mjs search / get nc/<컬렉션> <폴더> --filter <id>
    ⚠ 라이선스 미확인 — 레포에 LICENSE 파일이 없다. 프로토타입에는 쓰되 상업 배포(Verse8 Listed/수익화) 전에 주정민 또는 나인크로니클 쪽에 배포 조건을 확인할 것.

이 내용을 프로젝트 규칙 파일에 적어 둬 — 쓰는 도구에 맞게
(CLAUDE.md / AGENTS.md / .cursorrules / .github/copilot-instructions.md 등).
앞으로는 내가 id 만 말한다.
  예: "kenney/ui-pack 으로 메뉴 버튼 만들어줘", "ph/kloofendal_48d_partly_cloudy_puresky 를 하늘로 써줘"

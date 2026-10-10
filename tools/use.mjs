#!/usr/bin/env node
// Game Asset Library CLI — 검색하고 필요한 팩만 프로젝트로 가져온다 (Node 18+, 의존성 없음)
//
//   curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - search "sword" --type 3d
//   curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - info kenney/ui-pack
//   curl -sL https://hakyong-tae.github.io/game-asset-library/tools/use.mjs | node - get kenney/ui-pack public/assets/ui --credits CREDITS.md
//   (get 옵션: --filter <부분문자열>  --only png,glb  --credits <파일>)
//
// 로컬에 clone 했다면:  node tools/use.mjs get <id> <dest>
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.ASSET_LIB_BASE || 'https://hakyong-tae.github.io/game-asset-library/').replace(/\/?$/, '/');
const argv = process.argv.slice(2);   // node - <args>  /  node use.mjs <args> 모두 argv[2]부터
const flags = {}; const pos = [];
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { flags[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; } else pos.push(a); }
const [cmd, ...rest] = pos;
const enc = (rel) => rel.split('/').map(encodeURIComponent).join('/');
const getJson = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const fmt = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');

async function main() {
  if (!cmd || cmd === 'help') {
    console.log('사용법:\n  search <키워드...> [--type 2d|3d|audio|texture|icon|hdri|palette] [--files]\n  info <id>\n  get <id> <dest> [--filter 문자열] [--only png,glb] [--credits CREDITS.md]\n환경변수 ASSET_LIB_BASE 로 다른 베이스 지정 가능');
    return;
  }
  const data = await getJson(BASE + 'packs.json');
  if (/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE)) { data.volumes.main.base = BASE; data.volumes['3d'].base = BASE + '3d/'; }  // 로컬 테스트용
  // 외부(연결) 라이브러리: 매니페스트를 읽어 팩처럼 다룬다 (복사 재배포 아님 — 원작자 사이트에서 직접 받음)
  try {
    const ex = await getJson(BASE + 'externals.json');
    for (const src of ex.sources) for (const c of src.collections) {
      const m = await getJson(src.site + c.manifest).catch(() => null); if (!m) continue;
      const files = (m.assets || []).map((a) => { if (c.kind === 'sprites') return [a.file, 0, a.id]; const d = (a.animations && a.animations[a.defaultAnimation || 'default']) || {}; return [d.file || a.file || '', 0, a.id + (a.name && a.name !== a.id ? ' ' + a.name : '')]; }).filter((f) => f[0]);
      data.packs.push({ id: `${src.id}/${c.id}`, name: `${src.name} · ${c.name}`, type: c.type, license: src.license, licenseNote: src.licenseNote, author: src.author, origin: src.site, tags: [], files: files.length, bytes: 0, ext: true, base: src.site, manifest: c.manifest, _files: files });
    }
  } catch {}
  let tools = []; try { tools = (await getJson(BASE + 'tools.json')).tools || []; } catch {}
  const by = Object.fromEntries(data.packs.map((p) => [p.id, p]));
  const url = (p, rel = '') => (p.ext ? p.base : data.volumes[p.volume].base + p.path) + (rel ? enc(rel) : '');

  if (cmd === 'search') {
    const toks = rest.join(' ').toLowerCase().split(/\s+/).filter(Boolean);
    const hits = data.packs.filter((p) => (!flags.type || p.type === flags.type) && toks.every((t) => (p.id + ' ' + p.name + ' ' + p.tags.join(' ') + ' ' + p.author).toLowerCase().includes(t)));
    console.log(`팩 ${hits.length}개`); for (const p of hits.slice(0, 40)) console.log(`${p.id.padEnd(46)} ${p.type.padEnd(7)} ${p.license.padEnd(9)} ${String(p.files).padStart(6)}개 ${fmt(p.bytes).padStart(8)}  ${p.name}`);
    const th = tools.filter((t) => (!flags.type || flags.type === 'tool') && toks.every((k) => (t.id + ' ' + t.name + ' ' + t.summary + ' ' + t.tags.join(' ')).toLowerCase().includes(k)));
    if (th.length && toks.length) { console.log(`\n도구·스킬 ${th.length}개 (게임 에셋 아님 — 영상·모션 제작용, 링크만)`); for (const t of th.slice(0, 12)) console.log(`  ${t.id.padEnd(34)} ${t.license.padEnd(18)} ${t.repo}`); }
    if (flags.files !== false) {
      const s = await getJson(BASE + 'search.json'); const fh = [];
      for (const [i, nm] of s.e) { const id = s.ids[i]; const p = by[id]; if (!p || (flags.type && p.type !== flags.type)) continue; if (toks.every((t) => nm.includes(t) || id.toLowerCase().includes(t))) { fh.push(`${id}  ${nm}`); if (fh.length >= 40) break; } }
      for (const p of data.packs) { if (!p.ext || (flags.type && p.type !== flags.type)) continue; for (const f of p._files) if (toks.every((t) => (f[2] || f[0]).toLowerCase().includes(t))) { fh.push(`${p.id}  ${f[2] || f[0]}  (외부)`); if (fh.length >= 80) break; } }
      if (fh.length) { console.log(`\n파일 이름 일치 (상위 ${fh.length})`); fh.forEach((l) => console.log('  ' + l)); }
    }
    return;
  }
  const id = rest[0]; const p = by[id];
  if (!p) { console.error(`알 수 없는 id: ${id}  (search 로 찾아보세요)`); process.exit(1); }
  if (cmd === 'info') {
    const { _files, ...pub } = p; console.log(JSON.stringify({ ...pub, base: url(p), filesIndex: p.ext ? p.base + (p.manifest || '') : BASE + 'files/' + id.replace(/\//g, '__') + '.json' }, null, 2)); return;
  }
  if (cmd === 'get') {
    const dest = rest[1]; if (!dest) { console.error('dest 폴더를 지정하세요'); process.exit(1); }
    let files = p.ext ? p._files : await getJson(BASE + 'files/' + id.replace(/\//g, '__') + '.json');
    if (flags.filter) files = files.filter(([r]) => r.toLowerCase().includes(String(flags.filter).toLowerCase()));
    if (flags.only) { const ex = String(flags.only).toLowerCase().split(','); files = files.filter(([r]) => ex.includes(r.split('.').pop().toLowerCase()) || /^(license|credits)/i.test(path.basename(r))); }
    console.log(`${id}: ${files.length}개 파일 (${fmt(files.reduce((s, f) => s + f[1], 0))}) → ${dest}`);
    let done = 0, fail = 0; const q = files.slice();
    await Promise.all(Array.from({ length: 8 }, async () => { while (q.length) { const [rel] = q.shift(); const out = path.join(dest, rel); fs.mkdirSync(path.dirname(out), { recursive: true });
      try { const r = await fetch(url(p, rel)); if (!r.ok) throw new Error(r.status); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); if (++done % 200 === 0) console.log(`  … ${done}/${files.length}`); } catch (e) { fail++; console.error(`  실패: ${rel} (${e.message})`); } } }));
    fs.writeFileSync(path.join(dest, '.asset-source.json'), JSON.stringify({ id, name: p.name, license: p.license, author: p.author, origin: p.origin, library: BASE, fetched: new Date().toISOString() }, null, 2));
    if (flags.credits) { const line = `- ${p.name}${p.author ? ' by ' + p.author : ''} — ${p.license} — ${p.origin}  (${id})`; const f = String(flags.credits); const cur = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '# Credits\n\n'; if (!cur.includes(`(${id})`)) fs.writeFileSync(f, cur.replace(/\n*$/, '\n') + line + '\n'); }
    console.log(`완료: ${done}개 저장${fail ? `, 실패 ${fail}` : ''}${p.ext ? '\n⚠ 외부 라이브러리 — 라이선스 미확인: ' + (p.licenseNote || '') : p.license !== 'CC0' ? '\n⚠ CC BY — CREDITS 에 작가 표기 필수 (--credits CREDITS.md 로 자동 추가)' : ''}`);
    if (fail) process.exit(2); return;
  }
  console.error('알 수 없는 명령: ' + cmd);
  process.exit(1);
}
main().catch((e) => { console.error(e.message); process.exit(1); });

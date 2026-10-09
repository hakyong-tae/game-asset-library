/*
 * Game Asset Library loader — 브라우저/게임에서 팩 목록·파일 URL을 바로 쓰는 작은 헬퍼 (의존성 없음)
 *
 *   <script src="https://hakyong-tae.github.io/game-asset-library/loader.js"></script>
 *   const lib = await AssetLib.load();                       // packs.json 로드
 *   lib.search('hexagon', { type: '3d' })                    // 팩 검색
 *   lib.url('kenney/ui-pack', 'PNG/Blue/button.png')         // 파일 절대 URL
 *   await lib.files('kenney/ui-pack')                        // [[상대경로, 바이트], ...]
 *   await lib.find('kenney/ui-pack', /button/i)              // 경로 필터
 *   await lib.image('kenney/ui-pack', 'PNG/Blue/button.png') // HTMLImageElement
 *   await lib.buffer('kenney/impact-sounds', 'Audio/x.ogg', audioCtx)  // AudioBuffer
 *   await lib.searchFiles('sword', { type: '3d' })           // 파일 이름 검색(search.json 지연 로드)
 *   lib.credits(['kenney/ui-pack', 'game-icons'])            // CREDITS.md 용 마크다운
 *   await lib.loadExternals()                                // 연결된 외부 라이브러리(nc/effects, nc/characters, nc/icons …)를 packs 에 합침
 *
 * 프로토타입용 직링크. 배포하는 게임은 tools/use.mjs 로 필요한 파일을 프로젝트에 복사해서 번들할 것.
 */
(function (root) {
  'use strict';
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var DEFAULT_BASE = scriptSrc ? scriptSrc.replace(/[^/]*$/, '') : 'https://hakyong-tae.github.io/game-asset-library/';
  var enc = function (rel) { return rel.split('/').map(encodeURIComponent).join('/'); };

  function Lib(data, base) {
    this.base = base; this.data = data; this.packs = data.packs; this.vols = data.volumes;
    this.byId = {}; this.packs.forEach(function (p) { this.byId[p.id] = p; }, this);
    this._files = {}; this._idx = null;
  }
  Lib.prototype.pack = function (id) { var p = this.byId[id]; if (!p) throw new Error('unknown pack: ' + id); return p; };
  Lib.prototype.search = function (q, o) {
    o = o || {}; var toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    return this.packs.filter(function (p) {
      if (o.type && p.type !== o.type) return false;
      if (o.source && p.id.split('/')[0] !== o.source) return false;
      if (o.license && p.license !== o.license) return false;
      var h = (p.id + ' ' + p.name + ' ' + p.tags.join(' ') + ' ' + p.author).toLowerCase();
      return toks.every(function (t) { return h.indexOf(t) >= 0; });
    });
  };
  Lib.prototype.url = function (id, rel) { var p = this.pack(id); return (p.ext ? p.base : this.vols[p.volume].base + p.path) + (rel ? enc(rel) : ''); };
  Lib.prototype.files = function (id) {
    var self = this; if (this._files[id]) return Promise.resolve(this._files[id]);
    return fetch(this.base + 'files/' + id.replace(/\//g, '__') + '.json').then(function (r) { return r.json(); }).then(function (a) { return (self._files[id] = a); });
  };
  Lib.prototype.find = function (id, pattern) {
    return this.files(id).then(function (a) { var re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); return a.filter(function (f) { return re.test(f[0]); }).map(function (f) { return f[0]; }); });
  };
  Lib.prototype.image = function (id, rel) {
    var u = this.url(id, rel); return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('image load failed: ' + u)); }; i.src = u; });
  };
  Lib.prototype.audio = function (id, rel) { var a = new Audio(this.url(id, rel)); a.crossOrigin = 'anonymous'; a.preload = 'auto'; return a; };
  Lib.prototype.buffer = function (id, rel, ctx) { return fetch(this.url(id, rel)).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return ctx.decodeAudioData(b); }); };
  Lib.prototype.searchFiles = function (q, o) {
    var self = this; o = o || {}; var toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    var ready = this._idx ? Promise.resolve(this._idx) : fetch(this.base + 'search.json').then(function (r) { return r.json(); }).then(function (j) { return (self._idx = j); });
    return ready.then(function (idx) {
      var out = []; for (var i = 0; i < idx.e.length && out.length < (o.limit || 100); i++) {
        var id = idx.ids[idx.e[i][0]], nm = idx.e[i][1], p = self.byId[id]; if (!p || (o.type && p.type !== o.type)) continue;
        if (toks.every(function (t) { return nm.indexOf(t) >= 0 || id.toLowerCase().indexOf(t) >= 0; })) out.push({ id: id, name: nm });
      } return out;
    });
  };
  // 외부(연결) 라이브러리: externals.json 의 매니페스트를 읽어 packs 에 합친다 (파일은 복사하지 않고 원작자 사이트에서 직접 읽음)
  Lib.prototype.loadExternals = function () {
    var self = this;
    return fetch(this.base + 'externals.json').then(function (r) { return r.json(); }).then(function (j) {
      return Promise.all(j.sources.map(function (src) {
        return Promise.all(src.collections.map(function (c) {
          return fetch(src.site + c.manifest).then(function (r) { return r.json(); }).then(function (m) {
            var files = (m.assets || []).map(function (a) {
              if (c.kind === 'sprites') return [a.file, 0, a.id, a.id];
              var d = (a.animations && a.animations[a.defaultAnimation || 'default']) || {}; return [d.file || a.file || '', 0, a.id, a.id];
            }).filter(function (f) { return f[0]; });
            var p = { id: src.id + '/' + c.id, name: src.name + ' · ' + c.name, type: c.type, license: src.license, licenseNote: src.licenseNote, author: src.author, origin: src.site, tags: [], ext: true, base: src.site, manifest: c.manifest, extKind: c.kind, files: files.length };
            self.packs.push(p); self.byId[p.id] = p; self._files[p.id] = files; return p;
          });
        }));
      })).then(function () { return self; });
    });
  };
  Lib.prototype.credits = function (ids) {
    var self = this; return ids.map(function (id) { var p = self.pack(id); return '- ' + p.name + (p.author ? ' by ' + p.author : '') + ' — ' + p.license + ' — ' + p.origin; }).join('\n');
  };

  root.AssetLib = {
    load: function (base) {
      base = (base || DEFAULT_BASE).replace(/\/?$/, '/');
      return fetch(base + 'packs.json').then(function (r) { if (!r.ok) throw new Error('packs.json ' + r.status); return r.json(); }).then(function (d) { if (/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(base)) { d.volumes.main.base = base; d.volumes['3d'].base = base + '3d/'; } return new Lib(d, base); });
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);

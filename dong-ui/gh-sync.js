/**
 * Read-only slice of dong-ui GitHub progress sync.
 * Same localStorage key and repo as the other apps (`dong-gh-sync`,
 * Dong-Xuyong/progress-sync). GET only — this file never prompts and never
 * writes Contents.
 *
 *   GhSync.readConfig()           -> { token, repo } | null
 *   GhSync.fetchJson(cfg, appId)  -> Promise<object|null>
 */
(function (global) {
  "use strict";

  var CONFIG_KEY = "dong-gh-sync";
  var DEFAULT_REPO = "Dong-Xuyong/progress-sync";
  var API = "https://api.github.com/repos/";

  function readConfig() {
    var cfg = null;
    try {
      cfg = JSON.parse(global.localStorage.getItem(CONFIG_KEY) || "null");
    } catch (e) {
      return null;
    }
    if (!cfg || typeof cfg.token !== "string" || !cfg.token.trim()) return null;
    var repo = typeof cfg.repo === "string" && cfg.repo.trim() ? cfg.repo.trim() : DEFAULT_REPO;
    return { token: cfg.token.trim(), repo: repo };
  }

  function fromBase64(b64) {
    return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, ""))));
  }

  function request(cfg, path) {
    return fetch(API + cfg.repo + "/" + path, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: "Bearer " + cfg.token,
        Accept: "application/vnd.github+json",
      },
    }).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) {
        var err = new Error("GitHub error " + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  }

  function parseFile(file) {
    if (!file) return null;
    if (file.content && file.encoding !== "none") {
      return JSON.parse(fromBase64(file.content));
    }
    return null;
  }

  function fetchJson(cfg, appId) {
    if (!cfg || !cfg.token) return Promise.reject(new Error("No GitHub token"));
    var name = String(appId || "").replace(/\.json$/, "");
    return request(cfg, "contents/" + encodeURIComponent(name) + ".json").then(function (file) {
      if (!file) return null;
      var parsed = parseFile(file);
      if (parsed) return parsed;
      if (!file.sha) throw new Error("GitHub file had no content");
      return request(cfg, "git/blobs/" + file.sha).then(function (blob) {
        var data = parseFile(blob);
        if (!data) throw new Error("GitHub blob had no content");
        return data;
      });
    });
  }

  global.GhSync = { readConfig: readConfig, fetchJson: fetchJson };
})(typeof window !== "undefined" ? window : globalThis);

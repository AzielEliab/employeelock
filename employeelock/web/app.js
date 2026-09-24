/* EmployeeLock UI. No CDN. No telemetry. */
(function () {
  const kid = document.getElementById("kid-plain");
  const statusLine = document.getElementById("status-line");
  const verifyLine = document.getElementById("verify-line");
  const rowsPre = document.getElementById("rows-pre");
  const importFile = document.getElementById("import-file");
  const openXlsx = document.getElementById("open-xlsx");

  const DEMO_A = "process outcome recorded with no named owner";
  const DEMO_B = "records desk took the ticket from the prior queue name";

  function fields() {
    return {
      event: document.getElementById("event").value,
      result: document.getElementById("result").value,
      blame: document.getElementById("blame").value,
      owner: document.getElementById("owner").value,
      renamed_from: document.getElementById("renamed_from").value,
      short: document.getElementById("short").value,
      long: document.getElementById("long").value,
      cites: document.getElementById("cites").value,
      confidence: document.getElementById("confidence").value,
      observer: document.getElementById("observer").value,
      exhibit: document.getElementById("exhibit").value
    };
  }

  function isShippedDemo(state) {
    const rows = (state && state.rows) || [];
    return rows.length === 2 && rows[0].event === DEMO_A && rows[1].event === DEMO_B;
  }

  function paint(state) {
    const c = (state && state.counts) || {};
    document.getElementById("c-events").textContent = c.events || 0;
    document.getElementById("c-unowned").textContent = c.unowned || 0;
    document.getElementById("c-renamed").textContent = c.renamed || 0;
    document.getElementById("c-ok").textContent = c.chain_ok || 0;
    document.getElementById("c-owned").textContent = c.owned || 0;
    document.getElementById("c-files").textContent = c.evidence_files || 0;
    const v = (state && state.verify) || {};
    const missing = (v.missing_files || []).length;
    let status = "Add a row when you are ready.";
    let next = "A blank owner is stored as UNOWNED.";
    if (v.ok === true) {
      status = "Chain matches. " + (v.rows || 0) + " rows.";
      if (v.unowned) status += " " + v.unowned + " with no owner.";
      if (missing) status += " " + missing + " file(s) not found on disk.";
      next = isShippedDemo(state)
        ? "These two rows are the shipped demo. Add your own row when you are ready."
        : "Add another row, or open Advanced for files and export.";
    } else if (v.ok === false) {
      status = "Chain does not match.";
      next = (v.errors && v.errors[0]) || "Verify failed.";
    }
    if (statusLine) statusLine.textContent = status;
    kid.textContent = next;
    verifyLine.textContent = v.ok === undefined
      ? ""
      : ("ok=" + v.ok + " rows=" + v.rows + " unowned=" + v.unowned + " missing=" + missing);
    rowsPre.textContent = JSON.stringify(state && state.rows ? state.rows : [], null, 2);
  }

  function showError(e) {
    const msg = (e && e.message) ? e.message : String(e);
    const text = msg + " Next: check the fields, then try Add row again.";
    kid.textContent = text;
    if (statusLine) statusLine.textContent = msg;
  }

  function post(url, body, headers) {
    return fetch(url, {
      method: "POST",
      headers: headers || { "Content-Type": "application/json" },
      body: body
    }).then(function (res) {
      return res.json().then(function (j) {
        if (!res.ok) throw new Error(j.error || ("HTTP " + res.status));
        return j;
      });
    });
  }

  function refresh() {
    return fetch("/api/state").then(function (r) { return r.json(); }).then(paint);
  }

  document.getElementById("btn-new").addEventListener("click", function () {
    post("/api/new", "{}").then(paint).catch(showError);
  });
  document.getElementById("btn-sample").addEventListener("click", function () {
    post("/api/sample", "{}").then(paint).catch(showError);
  });
  document.getElementById("btn-verify").addEventListener("click", function () {
    post("/api/verify", "{}").then(paint).catch(showError);
  });
  document.getElementById("btn-doctor").addEventListener("click", function () {
    post("/api/doctor", "{}").then(function (j) {
      const text = j.ok
        ? "Doctor passed."
        : "Doctor found a problem. Open Advanced to read the checks.";
      kid.textContent = text;
      if (statusLine) statusLine.textContent = text;
      rowsPre.textContent = JSON.stringify(j, null, 2);
      if (!j.ok) document.getElementById("advanced").open = true;
    }).catch(showError);
  });
  document.getElementById("btn-export").addEventListener("click", function () {
    post("/api/export", "{}").then(function (j) {
      const blob = new Blob([JSON.stringify(j.receipt, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = j.filename || "employeelock-receipt.json";
      a.click();
      const text = "Saved a JSON receipt on this computer.";
      kid.textContent = text;
      if (statusLine) statusLine.textContent = text;
      paint(j.receipt);
    }).catch(showError);
  });
  document.getElementById("btn-xlsx").addEventListener("click", function () {
    window.location.href = "/api/download.xlsx";
  });
  document.getElementById("btn-upload").addEventListener("click", function () { openXlsx.click(); });
  openXlsx.addEventListener("change", function () {
    const f = openXlsx.files && openXlsx.files[0];
    if (!f) return;
    f.arrayBuffer().then(function (buf) {
      return fetch("/api/upload-workbook", { method: "POST", body: buf });
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) throw new Error(j.error);
      paint(j);
    }).catch(showError);
  });

  document.getElementById("row-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    post("/api/append", JSON.stringify(fields())).then(function (state) {
      paint(state);
      document.getElementById("event").value = "";
      document.getElementById("result").value = "";
    }).catch(showError);
  });

  document.getElementById("btn-file").addEventListener("click", function () {
    if (!document.getElementById("event").value.trim()) {
      const text = "Write what happened, then add the file.";
      kid.textContent = text;
      if (statusLine) statusLine.textContent = text;
      document.getElementById("event").focus();
      return;
    }
    importFile.click();
  });
  importFile.addEventListener("change", function () {
    const list = Array.prototype.slice.call(importFile.files || []);
    if (!list.length) return;
    Promise.all(list.map(function (f) {
      return f.arrayBuffer().then(function (buf) {
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return { name: f.name, b64: btoa(bin) };
      });
    })).then(function (files) {
      const body = fields();
      body.files = files;
      return post("/api/import", JSON.stringify(body));
    }).then(paint).catch(showError);
  });

  const jsonFile = document.getElementById("aziel-import-json");
  const jsonImport = document.getElementById("aziel-import-json-btn");
  const jsonExport = document.getElementById("aziel-export-json-btn");
  const jsonStatus = document.getElementById("aziel-json-status");

  function say(message) {
    if (jsonStatus) jsonStatus.textContent = message;
  }

  function collect() {
    const data = { product: document.title || "", exported_at: new Date().toISOString(), author: "Aziel Eliab" };
    document.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.id || el.type === "file" || el.type === "password") return;
      data[el.id] = el.type === "checkbox" ? el.checked : el.value;
    });
    if (window.__azielLastJson && typeof window.__azielLastJson === "object") {
      data.last = window.__azielLastJson;
    }
    return data;
  }

  function apply(obj) {
    if (!obj || typeof obj !== "object") return;
    window.__azielLastJson = obj;
    Object.keys(obj).forEach(function (k) {
      if (k === "last" || k === "product" || k === "exported_at" || k === "author") return;
      const el = document.getElementById(k);
      if (!el || el.type === "file" || el.type === "password") return;
      if (el.type === "checkbox") el.checked = !!obj[k];
      else if ("value" in el) el.value = obj[k];
    });
  }

  if (jsonFile && jsonImport && jsonExport) {
    jsonImport.addEventListener("click", function () { jsonFile.click(); });
    jsonFile.addEventListener("change", function () {
      const f = jsonFile.files && jsonFile.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          apply(JSON.parse(String(reader.result || "{}")));
          say("Imported " + f.name);
        } catch (e) {
          say("That file is not JSON. Next: choose a .json file.");
        }
      };
      reader.readAsText(f);
    });
    jsonExport.addEventListener("click", function () {
      const blob = new Blob([JSON.stringify(collect(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "session.json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
      say("Exported JSON");
    });
  }

  refresh().catch(function (e) {
    const text = "Could not open the workbook. Next: run employeelock ui and reload this page.";
    kid.textContent = text;
    if (statusLine) statusLine.textContent = (e && e.message) ? e.message : text;
  });
})();

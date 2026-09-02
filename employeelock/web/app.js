/* EmployeeLock UI. No CDN. No telemetry. Not a court. Not a truth score. */
(function () {
  const kid = document.getElementById("kid-plain");
  const verifyLine = document.getElementById("verify-line");
  const rowsPre = document.getElementById("rows-pre");
  const advancedPanel = document.getElementById("advanced-panel");
  const viewSimple = document.getElementById("view-simple");
  const viewAdvanced = document.getElementById("view-advanced");
  const importFile = document.getElementById("import-file");
  const openXlsx = document.getElementById("open-xlsx");

  let advanced = false;
  document.body.classList.add("simple");

  function setView(next) {
    advanced = next;
    document.body.classList.toggle("simple", !advanced);
    viewSimple.classList.toggle("on", !advanced);
    viewAdvanced.classList.toggle("on", advanced);
    viewSimple.setAttribute("aria-pressed", String(!advanced));
    viewAdvanced.setAttribute("aria-pressed", String(advanced));
    advancedPanel.hidden = !advanced;
  }

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

  function paint(state) {
    const c = (state && state.counts) || {};
    document.getElementById("c-events").textContent = c.events || 0;
    document.getElementById("c-unowned").textContent = c.unowned || 0;
    document.getElementById("c-renamed").textContent = c.renamed || 0;
    document.getElementById("c-ok").textContent = c.chain_ok || 0;
    document.getElementById("c-owned").textContent = c.owned || 0;
    document.getElementById("c-files").textContent = c.evidence_files || 0;
    const v = (state && state.verify) || {};
    const ok = v.ok === true;
    kid.textContent = ok
      ? ("Chain hashes. " + (v.unowned || 0) + " unowned row(s). Missing files are a location problem, not a chain break.")
      : ("Chain did not hash. " + ((v.errors && v.errors[0]) || "Verify failed.") + " Editing a hashed cell on purpose is how you see a break.");
    verifyLine.textContent = v.ok === undefined
      ? ""
      : ("ok=" + v.ok + " rows=" + v.rows + " unowned=" + v.unowned + " missing=" + ((v.missing_files || []).length));
    rowsPre.textContent = JSON.stringify(state && state.rows ? state.rows : [], null, 2);
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

  viewSimple.addEventListener("click", function () { setView(false); });
  viewAdvanced.addEventListener("click", function () { setView(true); });

  document.getElementById("btn-new").addEventListener("click", function () {
    post("/api/new", "{}").then(paint).catch(function (e) { kid.textContent = String(e); });
  });
  document.getElementById("btn-sample").addEventListener("click", function () {
    post("/api/sample", "{}").then(paint).catch(function (e) { kid.textContent = String(e); });
  });
  document.getElementById("btn-verify").addEventListener("click", function () {
    post("/api/verify", "{}").then(paint).catch(function (e) { kid.textContent = String(e); });
  });
  document.getElementById("btn-doctor").addEventListener("click", function () {
    post("/api/doctor", "{}").then(function (j) {
      kid.textContent = j.ok ? "Doctor passed. Engine, formulas, tamper check, import hash, loopback." : "Doctor failed.";
      rowsPre.textContent = JSON.stringify(j, null, 2);
    }).catch(function (e) { kid.textContent = String(e); });
  });
  document.getElementById("btn-export").addEventListener("click", function () {
    post("/api/export", "{}").then(function (j) {
      const blob = new Blob([JSON.stringify(j.receipt, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = j.filename || "employeelock-receipt.json";
      a.click();
      kid.textContent = "Exported a JSON receipt. Not a court filing.";
      paint(j.receipt);
    }).catch(function (e) { kid.textContent = String(e); });
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
    }).then(function (r) { return r.json(); }).then(paint);
  });

  document.getElementById("row-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    post("/api/append", JSON.stringify(fields())).then(paint).catch(function (e) { kid.textContent = String(e); });
  });

  document.getElementById("btn-file").addEventListener("click", function () { importFile.click(); });
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
    }).then(paint).catch(function (e) { kid.textContent = String(e); });
  });

  refresh().catch(function (e) { kid.textContent = String(e); });
})();

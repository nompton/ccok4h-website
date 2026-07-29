// Handles any enrollment form with id="enroll" that posts to /api/join.
// Optional elements: #enrollErr (error box), #enrollOk (success block), #enrollBtn (submit).
// A [name=connection] field may be a <select> or a hidden <input> (e.g. locked to "Alumni").
(function () {
  var form = document.getElementById("enroll");
  if (!form) return;
  var errBox = document.getElementById("enrollErr");
  var okWrap = document.getElementById("enrollOk");
  var btn = document.getElementById("enrollBtn");

  function val(name) {
    var el = form.querySelector("[name=" + name + "]");
    return el ? el.value.trim() : "";
  }
  function showErr(msg) {
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.style.display = "block";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errBox) errBox.style.display = "none";

    var monthlyEl = form.querySelector("[name=monthly]");
    var data = {
      first: val("first"),
      last: val("last"),
      email: val("email"),
      phone: val("phone"),
      connection: val("connection"),
      club: val("club"),
      interests: [].map.call(form.querySelectorAll("input[name=interest]:checked"), function (i) { return i.value; }),
      monthly: monthlyEl ? monthlyEl.checked : false,
      website: val("website")
    };

    if (!data.first || !data.last || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      showErr("Please enter your name and a valid email.");
      return;
    }

    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Adding…"; }

    fetch("/api/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j && res.j.ok) {
          form.style.display = "none";
          if (okWrap) okWrap.style.display = "block";
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          showErr((res.j && res.j.error) || "Something went wrong. Please try again.");
        }
      })
      .catch(function () { showErr("Network error — please try again."); })
      .finally(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
  });
})();

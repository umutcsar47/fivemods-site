(function () {
  var config = window.FiveModsCounterConfig || {};
  var workerBaseUrl = (config.workerBaseUrl || "").trim().replace(/\/+$/, "");
  var refreshMs = Number(config.statsRefreshMs || 15000);
  var storageKey = "fivemods_admin_secret";

  if (document.body) {
    var customStorageKey = (document.body.getAttribute("data-admin-storage-key") || "").trim();
    if (customStorageKey) {
      storageKey = customStorageKey;
    }
  }

  var secretInput = document.getElementById("admin-secret");
  var saveButton = document.getElementById("save-secret");
  var refreshButton = document.getElementById("refresh-stats");
  var statusBox = document.getElementById("status-box");
  var totalBox = document.getElementById("total-downloads");
  var appBox = document.getElementById("app-downloads");
  var trackedBox = document.getElementById("tracked-mods");
  var updatedBox = document.getElementById("last-updated");
  var cardsBox = document.getElementById("stats-cards");
  var endpointBox = document.getElementById("worker-endpoint") || document.querySelector(".endpoint-box");
  var helperBox = document.getElementById("helper-text");

  if (
    !secretInput ||
    !saveButton ||
    !refreshButton ||
    !statusBox ||
    !totalBox ||
    !trackedBox ||
    !updatedBox ||
    !cardsBox ||
    !helperBox
  ) {
    return;
  }

  function setStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.classList.toggle("is-error", !!isError);
  }

  function formatDate(value) {
    if (!value) {
      return "Henuz kayit yok";
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(date);
  }

  function renderStats(data) {
    totalBox.textContent = String(data.totalDownloads || 0);
    if (appBox) {
      appBox.textContent = String(data.appDownloads || 0);
    }
    trackedBox.textContent = String(data.trackedMods || 0);
    updatedBox.textContent = formatDate(data.generatedAt);

    cardsBox.innerHTML = "";

    (data.items || []).forEach(function (item) {
      var card = document.createElement("article");
      card.className = "stat-card";

      var title = document.createElement("h3");
      title.textContent = item.name;

      var count = document.createElement("strong");
      count.textContent = (item.count || 0) + " indirme";

      var meta = document.createElement("p");
      meta.textContent = "Son indirme: " + formatDate(item.lastDownloadedAt);

      var names = Array.isArray(item.downloaders) ? item.downloaders : [];
      var list = document.createElement("ul");
      list.className = "downloader-list";

      if (!names.length) {
        var emptyItem = document.createElement("li");
        emptyItem.textContent = "Kullanici adi kaydi yok";
        list.appendChild(emptyItem);
      } else {
        names.forEach(function (entry) {
          var row = document.createElement("li");
          var name = entry && entry.name ? entry.name : "Bilinmeyen";
          var countText = Number(entry && entry.count ? entry.count : 0);
          row.textContent = countText > 1 ? name + " (" + countText + ")" : name;
          list.appendChild(row);
        });
      }

      card.appendChild(title);
      card.appendChild(count);
      card.appendChild(meta);
      card.appendChild(list);
      cardsBox.appendChild(card);
    });
  }

  async function loadStats() {
    var secret = secretInput.value.trim();

    if (!workerBaseUrl) {
      setStatus("Sayac servisi henuz baglanmadi. assets/fivemods-counter-config.js dosyasina worker adresi eklenmeli.", true);
      helperBox.textContent = "Worker adresi eklenmeden gercek sayac gorunmez.";
      return;
    }

    if (!secret) {
      setStatus("Admin gizli anahtarini gir.", true);
      return;
    }

    setStatus("Sayac verileri yenileniyor...", false);

    try {
      var response = await fetch(workerBaseUrl + "/api/stats", {
        method: "GET",
        headers: {
          "x-admin-secret": secret
        }
      });

      if (response.status === 401) {
        throw new Error("Admin anahtari yanlis.");
      }

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      var data = await response.json();
      renderStats(data);
      setStatus("Sayac verileri guncel.", false);
      helperBox.textContent = "Bu ekran sadece gizli anahtari bilen kisilerde veri gosterir.";
    } catch (error) {
      if (error && error.message === "Failed to fetch") {
        setStatus("Worker baglantisi kurulamadi. Internet veya tarayici engeli olabilir.", true);
        return;
      }

      setStatus("Sayac verileri alinamadi: " + error.message, true);
    }
  }

  function saveSecret() {
    var secret = secretInput.value.trim();

    if (!secret) {
      setStatus("Bos anahtar kaydedilemez.", true);
      return;
    }

    localStorage.setItem(storageKey, secret);
    setStatus("Admin anahtari bu tarayicida kaydedildi.", false);
    loadStats();
  }

  if (endpointBox) {
    endpointBox.textContent = workerBaseUrl || "Henuz ayarlanmadi";
  }
  secretInput.value = localStorage.getItem(storageKey) || "";

  saveButton.addEventListener("click", saveSecret);
  refreshButton.addEventListener("click", loadStats);
  secretInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveSecret();
    }
  });

  if (workerBaseUrl && secretInput.value.trim()) {
    loadStats();
    window.setInterval(loadStats, refreshMs);
  }
})();

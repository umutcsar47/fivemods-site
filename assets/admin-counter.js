(function () {
  var config = window.FiveModsCounterConfig || {};
  var workerBaseUrl = (config.workerBaseUrl || "").trim().replace(/\/+$/, "");
  var refreshMs = Number(config.statsRefreshMs || 15000);
  var storageKey = "fivemods_admin_secret";

  var secretInput = document.getElementById("admin-secret");
  var saveButton = document.getElementById("save-secret");
  var refreshButton = document.getElementById("refresh-stats");
  var statusBox = document.getElementById("status-box");
  var totalBox = document.getElementById("total-downloads");
  var trackedBox = document.getElementById("tracked-mods");
  var updatedBox = document.getElementById("last-updated");
  var cardsBox = document.getElementById("stats-cards");
  var endpointBox = document.getElementById("worker-endpoint");
  var helperBox = document.getElementById("helper-text");

  function setStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.classList.toggle("is-error", !!isError);
  }

  function formatDate(value) {
    if (!value) {
      return "Henüz kayıt yok";
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

      card.appendChild(title);
      card.appendChild(count);
      card.appendChild(meta);
      cardsBox.appendChild(card);
    });
  }

  async function loadStats() {
    var secret = secretInput.value.trim();

    if (!workerBaseUrl) {
      setStatus("Sayaç servisi henüz bağlanmadı. assets/fivemods-counter-config.js dosyasına worker adresi eklenmeli.", true);
      helperBox.textContent = "Worker adresi eklenmeden gerçek sayaç görünmez.";
      return;
    }

    if (!secret) {
      setStatus("Admin gizli anahtarını gir.", true);
      return;
    }

    setStatus("Sayaç verileri yenileniyor...", false);

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
      setStatus("Sayaç verileri güncel.", false);
      helperBox.textContent = "Bu ekran sadece gizli anahtarı bilen kişilerde veri gösterir.";
    } catch (error) {
      if (error && error.message === "Failed to fetch") {
        setStatus("Worker baglantisi kurulamadi. Internet veya tarayici engeli olabilir.", true);
        return;
      }

      setStatus("Sayaç verileri alınamadı: " + error.message, true);
    }
  }

  function saveSecret() {
    var secret = secretInput.value.trim();

    if (!secret) {
      setStatus("Boş anahtar kaydedilemez.", true);
      return;
    }

    localStorage.setItem(storageKey, secret);
    setStatus("Admin anahtarı bu tarayıcıda kaydedildi.", false);
    loadStats();
  }

  endpointBox.textContent = workerBaseUrl || "Henüz ayarlanmadı";
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

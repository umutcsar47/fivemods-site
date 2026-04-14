window.ModCounterConfig = window.ModCounterConfig || {
  // Worker adresi kaynakta duz metin olarak tutulmuyor.
  workerBaseUrl: (function () {
    try {
      return atob("aHR0cHM6Ly9maXZlbW9kcy1kb3dubG9hZC1jb3VudGVyLnVtdXRjYW5zaW5jYXIud29ya2Vycy5kZXY=");
    } catch (error) {
      return "";
    }
  })(),
  statsRefreshMs: 15000
};



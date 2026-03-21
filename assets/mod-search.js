(function () {
  const inputs = Array.from(document.querySelectorAll("[data-mod-search]"));
  const cards = Array.from(document.querySelectorAll(".mods-grid .card"));
  const countEls = Array.from(document.querySelectorAll("[data-search-count]"));

  if (!inputs.length || !cards.length) {
    return;
  }

  const synonymMap = {
    radio: ["radyo", "rdo"],
    radyo: ["radio", "rdo"],
    radyoo: ["radio", "radyo"],
    rdo: ["radio", "radyo"],
    mod: ["mods", "modlar", "paket", "pack", "script", "resource"],
    mods: ["mod", "modlar", "paket", "pack", "script", "resource"],
    modlar: ["mod", "mods", "paket", "pack", "script"],
    paket: ["pack", "package", "mod", "script"],
    pack: ["paket", "package", "mod", "script"],
    package: ["paket", "pack", "mod"],
    script: ["mod", "resource", "paket"],
    surum: ["version", "versiyon", "v"],
    surumler: ["versions", "versiyonlar"],
    version: ["versiyon", "surum", "v"],
    versiyon: ["version", "surum", "v"],
    guncel: ["latest", "yeni", "son"],
    yeni: ["new", "latest", "guncel", "son"],
    five: ["fivem", "fivemods"],
    fivem: ["five", "fivemods"],
    fivemods: ["fivem", "five"]
  };

  const normalize = (value) => (value || "")
    .toString()
    .toLowerCase()
    .replace(/\u0131/g, "i")
    .replace(/\u0130/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const clean = (value) => normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const compact = (value) => normalize(value).replace(/[^a-z0-9]/g, "");

  const unique = (list) => Array.from(new Set(list.filter(Boolean)));

  const isDigitToken = (value) => /^\d+$/.test(value);

  const splitWords = (value) => clean(value).split(" ").filter(Boolean);

  const buildQueryTokens = (value) => {
    const rawTokens = splitWords(value);
    const tokens = [];

    for (let i = 0; i < rawTokens.length; i += 1) {
      const current = rawTokens[i];
      const next = rawTokens[i + 1];
      const nextTwo = rawTokens[i + 2];

      if (current === "v" && isDigitToken(next) && isDigitToken(nextTwo)) {
        tokens.push(`v${next}.${nextTwo}`);
        i += 2;
        continue;
      }

      if (/^v\d+$/.test(current) && isDigitToken(next)) {
        tokens.push(`${current}.${next}`);
        i += 1;
        continue;
      }

      if (isDigitToken(current) && isDigitToken(next)) {
        tokens.push(`${current}.${next}`);
        i += 1;
        continue;
      }

      const radioJoined = current.match(/^(radio|radyo|rdo)(\d{2})$/);
      if (radioJoined) {
        tokens.push(radioJoined[1]);
        tokens.push(`v${radioJoined[2][0]}.${radioJoined[2][1]}`);
        continue;
      }

      tokens.push(current);
    }

    return unique(tokens);
  };

  const expandVersionToken = (token) => {
    const normalized = clean(token);
    const variants = new Set();

    const pushVersion = (major, minor, withPrefix) => {
      const prefix = withPrefix ? "v" : "";
      variants.add(`${prefix}${major}.${minor}`);
      variants.add(`${prefix}${major}${minor}`);
      variants.add(`${prefix}${major} ${minor}`);
      variants.add(`${major}.${minor}`);
      variants.add(`${major}${minor}`);
      variants.add(`${major} ${minor}`);
    };

    const dotted = normalized.match(/^v?(\d+)\s*[.\- ]\s*(\d+)$/);
    if (dotted) {
      pushVersion(dotted[1], dotted[2], normalized.startsWith("v"));
    }

    const joined = compact(token).match(/^v?(\d)(\d)$/);
    if (joined) {
      pushVersion(joined[1], joined[2], compact(token).startsWith("v"));
    }

    return unique(Array.from(variants).map(clean).concat(Array.from(variants).map(compact)));
  };

  const versionLikeToken = (token) => {
    const value = clean(token);
    return /^v?\d+(?:\s*[.\- ]\s*\d+)?$/.test(value) || /^v?\d{2}$/.test(compact(token));
  };

  const isSubsequence = (needle, haystack) => {
    if (!needle || !haystack) {
      return false;
    }

    let pointer = 0;
    for (let i = 0; i < haystack.length; i += 1) {
      if (haystack[i] === needle[pointer]) {
        pointer += 1;
        if (pointer === needle.length) {
          return true;
        }
      }
    }

    return false;
  };

  const editDistanceWithin = (left, right, maxDistance) => {
    if (!left || !right) {
      return false;
    }

    if (Math.abs(left.length - right.length) > maxDistance) {
      return false;
    }

    let previous = Array.from({ length: right.length + 1 }, function (_, index) {
      return index;
    });

    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      let minInRow = current[0];

      for (let j = 1; j <= right.length; j += 1) {
        const substitution = left[i - 1] === right[j - 1] ? 0 : 1;
        const value = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + substitution
        );
        current[j] = value;
        minInRow = Math.min(minInRow, value);
      }

      if (minInRow > maxDistance) {
        return false;
      }

      previous = current;
    }

    return previous[right.length] <= maxDistance;
  };

  const expandToken = (token) => {
    const normalized = clean(token);
    const variants = new Set([normalized, compact(token)]);

    (synonymMap[normalized] || []).forEach(function (entry) {
      variants.add(clean(entry));
      variants.add(compact(entry));
    });

    expandVersionToken(token).forEach(function (entry) {
      variants.add(entry);
    });

    return unique(Array.from(variants).filter(function (entry) {
      return entry && entry.length > 0;
    }));
  };

  const candidateScore = (query, candidate) => {
    if (!query || !candidate) {
      return 0;
    }

    const queryCompact = compact(query);
    const candidateCompact = compact(candidate);

    if (candidate === query || candidateCompact === queryCompact) {
      return 150;
    }

    if (candidate.startsWith(query) || candidateCompact.startsWith(queryCompact)) {
      return 120;
    }

    if (candidate.includes(query) || candidateCompact.includes(queryCompact)) {
      return 95;
    }

    if (queryCompact.length >= 2 && isSubsequence(queryCompact, candidateCompact)) {
      return 65;
    }

    if (queryCompact.length >= 4 && editDistanceWithin(queryCompact, candidateCompact, 1)) {
      return 60;
    }

    if (queryCompact.length >= 6 && editDistanceWithin(queryCompact, candidateCompact, 2)) {
      return 45;
    }

    return 0;
  };

  const data = cards.map(function (card, index) {
    const titleEl = card.querySelector("h3");
    const metaEl = card.querySelector(".card-meta");
    const title = titleEl ? titleEl.textContent : "";
    const meta = metaEl ? metaEl.textContent : "";
    const extra = card.dataset.search || "";
    const raw = [extra, title, meta, "fivem fivemods mod modlar paket script resource"].join(" ");

    const extraAliases = [];
    if (clean(raw).includes("radio")) {
      extraAliases.push("radio", "radyo", "rdo");
    }

    const words = unique(splitWords(raw).concat(extraAliases));
    const compactWords = unique(words.map(compact));
    const versionVariants = unique(
      words
        .filter(versionLikeToken)
        .reduce(function (all, token) {
          return all.concat(expandVersionToken(token));
        }, [])
    );

    return {
      card: card,
      index: index,
      title: clean(title),
      text: clean(raw),
      compact: compact(raw),
      words: words,
      compactWords: compactWords,
      versionVariants: versionVariants
    };
  });

  const scoreToken = (item, token) => {
    const variants = expandToken(token);
    let best = 0;

    variants.forEach(function (variant) {
      best = Math.max(best, candidateScore(variant, item.title));
      best = Math.max(best, candidateScore(variant, item.text));
      best = Math.max(best, candidateScore(variant, item.compact));

      item.words.forEach(function (word) {
        best = Math.max(best, candidateScore(variant, word));
      });

      item.compactWords.forEach(function (word) {
        best = Math.max(best, candidateScore(variant, word));
      });
    });

    return best;
  };

  const buildQuery = (value) => {
    const tokens = buildQueryTokens(value);
    const strictVersionToken = tokens.filter(versionLikeToken);
    const nonVersionTokens = tokens.filter(function (token) {
      return !versionLikeToken(token) && !["radio", "radyo", "rdo"].includes(clean(token));
    });

    return {
      clean: clean(value),
      compact: compact(value),
      tokens: tokens,
      strictVersions: unique(
        strictVersionToken.reduce(function (all, token) {
          return all.concat(expandVersionToken(token));
        }, [])
      ),
      strictVersionMode: strictVersionToken.length > 0 && nonVersionTokens.length === 0
    };
  };

  const scoreItem = (item, query) => {
    if (!query.clean && !query.compact) {
      return 0;
    }

    if (query.strictVersionMode) {
      const exactVersionMatch = query.strictVersions.some(function (variant) {
        return item.versionVariants.includes(variant);
      });

      if (!exactVersionMatch) {
        return 0;
      }
    }

    let score = 0;
    let matchedTokens = 0;

    if (query.clean && item.title.startsWith(query.clean)) {
      score += 260;
    } else if (query.clean && item.title.includes(query.clean)) {
      score += 190;
    } else if (query.clean && item.text.includes(query.clean)) {
      score += 150;
    }

    if (query.compact && item.compact.startsWith(query.compact)) {
      score += 180;
    } else if (query.compact && item.compact.includes(query.compact)) {
      score += 130;
    }

    query.tokens.forEach(function (token, index) {
      const tokenScore = scoreToken(item, token);
      if (tokenScore > 0) {
        matchedTokens += 1;
        score += tokenScore;
        if (index === 0) {
          score += 15;
        }
      }
    });

    if (!matchedTokens) {
      return 0;
    }

    if (query.tokens.length > 1) {
      const minimumHits = Math.max(1, Math.ceil(query.tokens.length * 0.6));
      if (matchedTokens < minimumHits) {
        return 0;
      }

      if (matchedTokens === query.tokens.length) {
        score += 120;
      } else {
        score += matchedTokens * 20;
      }
    }

    if (query.clean) {
      score += Math.max(0, 40 - Math.abs(item.title.length - query.clean.length));
    }

    return score;
  };

  const updateCount = (value) => {
    countEls.forEach(function (el) {
      el.textContent = "Sonu\u00e7: " + value;
    });
  };

  const showAll = () => {
    cards.forEach(function (card) {
      card.style.display = "";
      card.style.order = "";
    });
    updateCount(cards.length);
  };

  const syncInputs = (activeInput) => {
    inputs.forEach(function (input) {
      if (input !== activeInput) {
        input.value = activeInput.value;
      }
    });
  };

  const applyFilter = (value) => {
    const query = buildQuery(value);

    if (!query.clean && !query.compact) {
      showAll();
      return;
    }

    const results = data
      .map(function (item) {
        return { item: item, score: scoreItem(item, query) };
      })
      .filter(function (row) {
        return row.score > 0;
      })
      .sort(function (left, right) {
        return right.score - left.score || left.item.index - right.item.index;
      });

    cards.forEach(function (card) {
      card.style.display = "none";
      card.style.order = "";
    });

    results.forEach(function (row, index) {
      row.item.card.style.display = "";
      row.item.card.style.order = String(index);
    });

    updateCount(results.length);
  };

  window.__fmFilter = applyFilter;

  inputs.forEach(function (input) {
    const handler = function () {
      syncInputs(input);
      applyFilter(input.value);
    };

    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", handler);
    input.addEventListener("keyup", handler);
    input.addEventListener("change", handler);
    input.addEventListener("search", handler);
  });

  document.querySelectorAll(".search button").forEach(function (button) {
    button.addEventListener("click", function () {
      const wrapper = button.closest(".search");
      if (!wrapper) {
        return;
      }

      const input = wrapper.querySelector("[data-mod-search]");
      if (!input) {
        return;
      }

      syncInputs(input);
      applyFilter(input.value);
    });
  });

  showAll();
})();

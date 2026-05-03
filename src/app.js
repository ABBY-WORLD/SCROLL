const feedDeck = document.querySelector("#feedDeck");
const classicFeed = document.querySelector("#classicFeed");
const arenaFeed = document.querySelector("#arenaFeed");
const template = document.querySelector("#artworkTemplate");
const likeCount = document.querySelector("#likeCount");
const boardPanel = document.querySelector("#boardPanel");
const boardGrid = document.querySelector("#boardGrid");
const emptyBoard = document.querySelector("#emptyBoard");
const sourceStatus = document.querySelector("#sourceStatus");
const eraOptions = document.querySelectorAll(".era-option");
const refreshButton = document.querySelector("#refreshButton");
const openBoardButton = document.querySelector("#openBoardButton");
const musicButton = document.querySelector("#musicButton");
const radioRandomButton = document.querySelector("#radioRandomButton");
const ambientAudio = document.querySelector("#ambientAudio");

const STORAGE_KEY = "artscroll.likes.v1";
const ARENA_CACHE_KEY = "artscroll.arena.cache.v1";
const ARENA_CACHE_AGE = 12 * 60 * 60 * 1000;
const LOAD_SIZE = 8;
const ARENA_PAGE_SIZE = 10;
const ARENA_MIN_CACHE_ITEMS = 30;

const RADIO_STATIONS = [
  {
    name: "Digitalis",
    streams: [
      "https://ice5.somafm.com/digitalis-128-mp3",
      "https://ice3.somafm.com/digitalis-128-mp3",
    ],
  },
  {
    name: "SF 10-33",
    streams: [
      "https://ice5.somafm.com/sf1033-128-mp3",
      "https://ice3.somafm.com/sf1033-128-mp3",
    ],
  },
  {
    name: "n5MD Radio",
    streams: [
      "https://ice5.somafm.com/n5md-128-mp3",
      "https://ice3.somafm.com/n5md-128-mp3",
    ],
  },
  {
    name: "Synphaera Radio",
    streams: [
      "https://ice5.somafm.com/synphaera-128-mp3",
      "https://ice3.somafm.com/synphaera-128-mp3",
    ],
  },
];

const SEARCH_QUERIES = [
  "image",
  "visual",
  "art",
  "photography",
  "archive",
  "moodboard",
  "reference",
];

const SEED_CHANNELS = [
  "visual-research",
  "image-research",
  "public-domain-images",
  "textures",
  "editorial-photography",
];

const arenaFallbackItems = [
  {
    id: "arena-fallback-visual-research-3207131",
    title: "Visual Research",
    imageUrl:
      "https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIzMjA3MTMxL29yaWdpbmFsX2I1Mzc1N2NlYzdlMjI3MjdlY2JkODViYjVjNmViNTU4LmpwZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTIwMCwiaGVpZ2h0IjoxMjAwLCJmaXQiOiJpbnNpZGUiLCJ3aXRob3V0RW5sYXJnZW1lbnQiOnRydWV9LCJ3ZWJwIjp7InF1YWxpdHkiOjc1fSwianBlZyI6eyJxdWFsaXR5Ijo3NX0sInJvdGF0ZSI6bnVsbH19?bc=1",
    thumbnailUrl:
      "https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIzMjA3MTMxL29yaWdpbmFsX2I1Mzc1N2NlYzdlMjI3MjdlY2JkODViYjVjNmViNTU4LmpwZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6NDAwLCJoZWlnaHQiOjQwMCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==?bc=1",
    sourceUrl: "https://www.are.na/block/3207131",
    source: "Collected from Are.na",
    artist: "Studio Pacific",
    date: "visual-research",
    medium: "License unknown",
    license: "License unknown",
    metadata: {
      channelSlug: "visual-research",
      channelTitle: "Visual Research",
    },
  },
];

let activeStationIndex = randomInt(0, RADIO_STATIONS.length - 1);
let activeStreamIndex = 0;
let activeFeedName = "classic";
let pointerStart = null;

const sourceState = {
  artic: { page: randomInt(1, 80), label: "Art Institute of Chicago" },
  cleveland: { skip: randomInt(0, 25000), label: "Cleveland Museum of Art" },
  met: { cursor: 0, ids: [], label: "The Met" },
  nga: { cursor: 0, label: "National Gallery of Art" },
};

const feedState = {
  classic: {
    element: classicFeed,
    label: "Open collections",
    items: [],
    isLoading: false,
    sentinel: null,
    loadMore: loadMoreClassicArt,
  },
  arena: {
    element: arenaFeed,
    label: "Are.na",
    items: [],
    cursor: 0,
    isLoading: false,
    sentinel: null,
    allItems: [],
    loadMore: loadMoreArenaArt,
  },
};

const ngaSeeds = [
  {
    id: "nga-lucia-bonasoni-garzoni",
    title: "Lucia Bonasoni Garzoni",
    artist: "Lavinia Fontana",
    date: "c. 1590",
    medium: "Oil on canvas",
    source: "National Gallery of Art",
    sourceUrl: "https://www.nga.gov/artworks",
    imageUrl:
      "https://api.nga.gov/iiif/3b5b7b90-f466-48fa-8202-bf5a4eb17dd2/full/!1200,1200/0/default.jpg",
    license: "Public domain",
  },
  {
    id: "nga-open-access-sample-1",
    title: "Open Access study",
    artist: "National Gallery of Art",
    date: "Public domain collection",
    medium: "IIIF image",
    source: "National Gallery of Art",
    sourceUrl: "https://www.nga.gov/artworks/free-images-and-open-access",
    imageUrl:
      "https://api.nga.gov/iiif/a2e6da57-3cd1-4235-b20e-95dcaefed6c8/full/!1200,1200/0/default.jpg",
    license: "Public domain",
  },
];

const fallbackArtworks = [
  {
    id: "fallback-bedroom",
    title: "The Bedroom",
    artist: "Vincent van Gogh",
    date: "1889",
    medium: "Oil on canvas",
    source: "Art Institute of Chicago",
    sourceUrl: "https://www.artic.edu/artworks/28560/the-bedroom",
    imageUrl:
      "https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/843,/0/default.jpg",
    license: "CC0",
  },
  ...ngaSeeds,
];

let likes = readLikes();

init();

function init() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  feedDeck.scrollTo({ left: 0 });
  classicFeed.scrollTo({ top: 0 });
  arenaFeed.scrollTo({ top: 0 });
  setActiveStation(activeStationIndex);
  updateLikeCount();
  renderBoard();
  bindEvents();
  renderLoader(feedState.classic.element);
  renderLoader(feedState.arena.element);
  loadMoreClassicArt();
  prepareArenaFeed();
}

function bindEvents() {
  refreshButton.addEventListener("click", () => {
    if (activeFeedName === "arena") {
      refreshArenaFeed();
      return;
    }

    resetSourceState();
    resetFeed("classic");
    renderLoader(feedState.classic.element);
    loadMoreClassicArt();
  });

  openBoardButton.addEventListener("click", openBoard);
  musicButton.addEventListener("click", toggleMusic);
  radioRandomButton.addEventListener("click", switchRadioStation);
  ambientAudio.addEventListener("error", useNextMusicStream);

  document.querySelectorAll("[data-close-board]").forEach((button) => {
    button.addEventListener("click", closeBoard);
  });

  feedDeck.addEventListener("scroll", updateActiveFeedFromScroll);
  feedDeck.addEventListener("pointerdown", handlePointerStart);
  feedDeck.addEventListener("pointerup", handlePointerEnd);
  feedDeck.addEventListener("pointercancel", () => {
    pointerStart = null;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeBoard();
    }

    if (event.key === "ArrowRight" && !boardPanel.classList.contains("is-open")) {
      event.preventDefault();
      setActiveFeed("arena");
    }

    if (event.key === "ArrowLeft" && !boardPanel.classList.contains("is-open")) {
      event.preventDefault();
      setActiveFeed("classic");
    }

    if (["ArrowDown", "PageDown", " "].includes(event.key) && !boardPanel.classList.contains("is-open")) {
      event.preventDefault();
      getActiveFeed().scrollBy({ top: getActiveFeed().clientHeight, behavior: "smooth" });
    }

    if (["ArrowUp", "PageUp"].includes(event.key) && !boardPanel.classList.contains("is-open")) {
      event.preventDefault();
      getActiveFeed().scrollBy({ top: -getActiveFeed().clientHeight, behavior: "smooth" });
    }

    if (event.key.toLowerCase() === "r" && !boardPanel.classList.contains("is-open")) {
      event.preventDefault();
      switchRadioStation();
    }
  });

  window.addEventListener(
    "wheel",
    (event) => {
      if (boardPanel.classList.contains("is-open") || getActiveFeed().contains(event.target)) {
        return;
      }

      event.preventDefault();

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        feedDeck.scrollBy({ left: event.deltaX, behavior: "auto" });
        return;
      }

      getActiveFeed().scrollBy({ top: event.deltaY, behavior: "auto" });
    },
    { passive: false },
  );
}

function handlePointerStart(event) {
  if (event.target.closest("button, a")) {
    pointerStart = null;
    return;
  }

  pointerStart = {
    x: event.clientX,
    y: event.clientY,
  };
}

function handlePointerEnd(event) {
  if (!pointerStart || boardPanel.classList.contains("is-open")) {
    pointerStart = null;
    return;
  }

  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;

  if (Math.abs(deltaX) < 54 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) {
    return;
  }

  setActiveFeed(deltaX < 0 ? "arena" : "classic");
}

async function toggleMusic() {
  if (ambientAudio.paused) {
    ambientAudio.volume = 0.36;
    try {
      await ambientAudio.play();
      setMusicButtonState(true);
    } catch (error) {
      console.warn("Could not start SomaFM stream", error);
      setMusicButtonState(false);
    }
    return;
  }

  ambientAudio.pause();
  setMusicButtonState(false);
}

function setMusicButtonState(isPlaying) {
  musicButton.classList.toggle("is-playing", isPlaying);
  const station = RADIO_STATIONS[activeStationIndex];
  musicButton.setAttribute(
    "aria-label",
    isPlaying ? `Pause ${station.name}` : `Start ${station.name}`,
  );
  musicButton.setAttribute("title", `SomaFM: ${station.name}`);
  musicButton.setAttribute("aria-pressed", String(isPlaying));
  musicButton.querySelector("span").textContent = isPlaying ? "♫" : "♪";
  radioRandomButton.setAttribute("title", `Random radio station from ${station.name}`);
}

function setActiveStation(stationIndex) {
  activeStationIndex = stationIndex;
  activeStreamIndex = 0;
  ambientAudio.src = RADIO_STATIONS[activeStationIndex].streams[activeStreamIndex];
  setMusicButtonState(!ambientAudio.paused);
}

async function switchRadioStation() {
  const wasPlaying = !ambientAudio.paused;
  const nextIndex = randomOtherIndex(activeStationIndex, RADIO_STATIONS.length);
  ambientAudio.pause();
  setActiveStation(nextIndex);

  if (wasPlaying) {
    try {
      await ambientAudio.play();
      setMusicButtonState(true);
    } catch (error) {
      console.warn("Could not switch SomaFM stream", error);
      setMusicButtonState(false);
    }
  }
}

function useNextMusicStream() {
  const station = RADIO_STATIONS[activeStationIndex];
  if (activeStreamIndex >= station.streams.length - 1) {
    setMusicButtonState(false);
    return;
  }

  activeStreamIndex += 1;
  ambientAudio.src = station.streams[activeStreamIndex];

  if (musicButton.classList.contains("is-playing")) {
    ambientAudio.play().catch(() => setMusicButtonState(false));
  }
}

async function loadMoreClassicArt() {
  const state = feedState.classic;
  if (state.isLoading) return;
  state.isLoading = true;
  setStatus("Loading art...");

  try {
    const batches = await Promise.allSettled([
      fetchArtic(),
      fetchCleveland(),
      fetchMet(),
      fetchNgaSeeds(),
    ]);

    const nextArtworks = batches
      .flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
      .filter(Boolean);

    const unique = dedupe([...shuffle(nextArtworks)]).filter(
      (artwork) => !state.items.some((existing) => existing.id === artwork.id),
    );

    if (unique.length === 0 && state.items.length === 0) {
      renderArtworks("classic", fallbackArtworks);
    } else {
      renderArtworks("classic", unique);
    }

    setStatus(`${state.items.length} works loaded`);
  } catch (error) {
    console.error(error);
    if (state.items.length === 0) {
      renderArtworks("classic", fallbackArtworks);
    }
    setStatus("Offline examples");
  } finally {
    state.isLoading = false;
  }
}

async function prepareArenaFeed(forceRefresh = false) {
  const state = feedState.arena;
  setStatus(activeFeedName === "arena" ? "Loading Are.na..." : undefined);

  const cached = readArenaCache();
  if (!forceRefresh && cached?.items?.length) {
    state.allItems = randomizeArenaItems(cached.items);
    renderNextArenaBatch();
    setStatus(`${state.items.length} Are.na images`);
    if (cached.items.length >= ARENA_MIN_CACHE_ITEMS) {
      return;
    }
  }

  if (!state.items.length) {
    state.allItems = arenaFallbackItems;
    renderNextArenaBatch();
  }

  try {
    const channels = await discoverArenaChannels();
    const channelResults = [];

    for (const channel of channels.slice(0, 32)) {
      await delay(90);
      try {
        const result = await fetchAndScoreArenaChannel(channel);
        if (result) {
          channelResults.push(result);
        }
      } catch (error) {
        console.warn("Could not fetch Are.na channel", channel.slug, error);
      }
    }

    const topChannels = channelResults
      .filter((channel) => channel.imageDensity > 0.6 && channel.totalBlocks > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const normalized = weaveChannels(topChannels.flatMap((channel) => channel.items));
    const nextItems = normalized.length
      ? randomizeArenaItems(normalized)
      : randomizeArenaItems(cached?.items || arenaFallbackItems);
    writeArenaCache(nextItems, topChannels);

    if (nextItems.length > arenaFallbackItems.length) {
      resetFeed("arena");
      state.allItems = nextItems;
      renderNextArenaBatch();
    }

    setStatus(`${state.items.length} Are.na images`);
  } catch (error) {
    console.warn("Are.na ingest failed", error);
    if (!state.items.length) {
      state.allItems = randomizeArenaItems(cached?.items?.length ? cached.items : arenaFallbackItems);
      renderNextArenaBatch();
    }
    setStatus("Are.na fallback");
  }
}

async function refreshArenaFeed() {
  resetFeed("arena");
  feedState.arena.allItems = [];
  feedState.arena.cursor = 0;
  renderLoader(feedState.arena.element);
  await prepareArenaFeed(true);
}

async function discoverArenaChannels() {
  const discovered = new Map();

  SEED_CHANNELS.forEach((slug) => {
    discovered.set(slug, { slug, title: slug, length: 0 });
  });

  for (const query of shuffle(SEARCH_QUERIES)) {
    await delay(110);
    const page = randomInt(1, 3);
    const payload = await fetchJson(
      `https://api.are.na/v2/search/channels?q=${encodeURIComponent(query)}&per=8&page=${page}`,
    );
    (payload.channels || []).forEach((channel) => {
      if (channel.slug && !channel["nsfw?"] && channel.length > 10) {
        discovered.set(channel.slug, {
          slug: channel.slug,
          title: channel.title,
          length: channel.length,
        });
      }
    });
  }

  return [...discovered.values()].slice(0, 56);
}

async function fetchAndScoreArenaChannel(channel) {
  const slug = channel.slug;
  const pageCount = channel.length > 60 ? Math.min(Math.ceil(channel.length / 60), 8) : 1;
  const page = randomInt(1, pageCount);
  const payload = await fetchJson(`https://api.are.na/v2/channels/${slug}?per=60&page=${page}`);
  const blocks = payload.contents || [];
  const totalBlocks = payload.length || blocks.length;
  const imageBlocks = blocks.filter(isArenaImageBlock);
  const imageDensity = totalBlocks ? imageBlocks.length / Math.min(totalBlocks, blocks.length || totalBlocks) : 0;

  if (imageDensity <= 0.6 || totalBlocks <= 20 || imageBlocks.length === 0) {
    return null;
  }

  const avgResolutionScore = average(imageBlocks.map(getArenaResolutionScore));
  const freshnessScore = getFreshnessScore(imageBlocks);
  const channelSizeScore = Math.min(totalBlocks / 80, 1);
  const score =
    imageDensity * 0.5 + avgResolutionScore * 0.2 + freshnessScore * 0.2 + channelSizeScore * 0.1;

  return {
    slug: payload.slug || slug,
    title: payload.title || slug,
    totalBlocks,
    imageDensity,
    avgResolutionScore,
    freshnessScore,
    channelSizeScore,
    score,
    items: imageBlocks.map((block) => normalizeArenaBlock(block, payload)).filter(Boolean),
  };
}

function isArenaImageBlock(block) {
  return block?.class === "Image" || Boolean(block?.image);
}

function normalizeArenaBlock(block, channel) {
  const image = block.image || {};
  const imageUrl = image.display?.url || image.large?.url || image.original?.url || image.thumb?.url;
  if (!imageUrl) return null;

  const channelSlug = channel.slug;
  const channelTitle = channel.title || channelSlug;
  const creator = block.user?.full_name || block.connected_by_username || "Are.na";

  return {
    id: `arena-${block.id}`,
    title: cleanTitle(block.title || block.generated_title || channelTitle),
    imageUrl,
    thumbnailUrl: image.thumb?.url || image.square?.url || imageUrl,
    sourceUrl: `https://www.are.na/block/${block.id}`,
    source: "Collected from Are.na",
    artist: creator,
    date: channelTitle,
    medium: "License unknown",
    license: "License unknown",
    attribution: creator,
    metadata: {
      channelSlug,
      channelTitle,
    },
  };
}

function renderNextArenaBatch() {
  const state = feedState.arena;
  if (!state.allItems.length) return;

  const next = state.allItems.slice(state.cursor, state.cursor + ARENA_PAGE_SIZE);
  state.cursor += next.length;

  if (next.length === 0) {
    state.cursor = 0;
    renderNextArenaBatch();
    return;
  }

  renderArtworks("arena", next);
}

async function loadMoreArenaArt() {
  const state = feedState.arena;
  if (state.isLoading) return;
  state.isLoading = true;
  renderNextArenaBatch();
  setStatus(`${state.items.length} Are.na images`);
  state.isLoading = false;
}

async function fetchArtic() {
  sourceState.artic.page += randomInt(1, 4);

  const fields = "id,title,artist_display,date_display,image_id,thumbnail";
  const url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&limit=${LOAD_SIZE}&page=${sourceState.artic.page}&fields=${fields}`;
  const payload = await fetchJson(url);
  const iiifUrl = payload.config?.iiif_url || "https://www.artic.edu/iiif/2";

  return payload.data
    .filter((item) => item.image_id)
    .map((item) => ({
      id: `artic-${item.id}`,
      title: item.title,
      artist: cleanLine(item.artist_display) || "Unknown artist",
      date: item.date_display,
      medium: "Artwork",
      source: sourceState.artic.label,
      sourceUrl: `https://www.artic.edu/artworks/${item.id}`,
      imageUrl: `${iiifUrl}/${item.image_id}/full/843,/0/default.jpg`,
      alt: item.thumbnail?.alt_text,
      license: "CC0",
    }));
}

async function fetchCleveland() {
  const fields = [
    "id",
    "title",
    "creators",
    "creation_date",
    "technique",
    "type",
    "images",
    "url",
  ].join(",");

  const skip = sourceState.cleveland.skip;
  sourceState.cleveland.skip += LOAD_SIZE + randomInt(12, 44);

  const url = `https://openaccess-api.clevelandart.org/api/artworks/?cc0=1&has_image=1&limit=${LOAD_SIZE}&skip=${skip}&fields=${fields}`;
  const payload = await fetchJson(url);

  return payload.data
    .filter((item) => item.images?.web?.url)
    .map((item) => ({
      id: `cleveland-${item.id}`,
      title: item.title,
      artist: item.creators?.[0]?.description || "Unknown artist",
      date: item.creation_date,
      medium: item.technique || item.type,
      source: sourceState.cleveland.label,
      sourceUrl: item.url,
      imageUrl: item.images.web.url,
      license: "CC0",
    }));
}

async function fetchMet() {
  if (sourceState.met.ids.length === 0) {
    const terms = ["painting", "portrait", "landscape", "flowers", "japan", "textile"];
    const term = terms[randomInt(0, terms.length - 1)];
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isPublicDomain=true&q=${encodeURIComponent(
      term,
    )}`;
    const search = await fetchJson(searchUrl);
    sourceState.met.ids = shuffle(search.objectIDs || []).slice(0, 80);
    sourceState.met.cursor = 0;
  }

  const ids = sourceState.met.ids.slice(sourceState.met.cursor, sourceState.met.cursor + 5);
  sourceState.met.cursor += ids.length;

  const records = await Promise.allSettled(
    ids.map((id) =>
      fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`),
    ),
  );

  return records
    .filter((record) => record.status === "fulfilled")
    .map((record) => record.value)
    .filter((item) => item.isPublicDomain && item.primaryImageSmall)
    .map((item) => ({
      id: `met-${item.objectID}`,
      title: item.title,
      artist: item.artistDisplayName || item.culture || "Unknown artist",
      date: item.objectDate,
      medium: item.medium || item.classification,
      source: sourceState.met.label,
      sourceUrl: item.objectURL,
      imageUrl: item.primaryImageSmall,
      license: "Public domain",
    }));
}

async function fetchNgaSeeds() {
  const item = ngaSeeds[sourceState.nga.cursor % ngaSeeds.length];
  sourceState.nga.cursor += 1;
  return [item];
}

function renderArtworks(feedName, nextArtworks) {
  const state = feedState[feedName];
  removeLoader(state.element);

  const fragment = document.createDocumentFragment();
  nextArtworks.forEach((artwork) => {
    state.items.push(artwork);
    fragment.append(renderArtworkCard(artwork));
  });
  state.element.append(fragment);
  observeEnd(feedName);
}

function renderArtworkCard(artwork) {
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".art-image");
  const title = card.querySelector("h2");
  const artist = card.querySelector(".artist");
  const details = card.querySelector(".details");
  const sourcePill = card.querySelector(".source-pill");
  const licensePill = card.querySelector(".license-pill");
  const likeButton = card.querySelector(".like-button");
  const sourceLink = card.querySelector(".source-link");

  card.dataset.artworkId = artwork.id;
  image.src = artwork.imageUrl;
  image.alt = artwork.alt || `${artwork.title} by ${artwork.artist}`;
  title.textContent = artwork.title || "Untitled";
  artist.textContent = artwork.artist || artwork.attribution || "Unknown artist";
  details.textContent = [artwork.date, artwork.medium].filter(Boolean).join(" · ");
  sourcePill.textContent = artwork.source;
  licensePill.textContent = artwork.license || "Public domain / CC0";
  sourceLink.href = artwork.sourceUrl || artwork.imageUrl;

  syncLikeButton(likeButton, artwork.id);
  likeButton.addEventListener("click", () => toggleLike(artwork, likeButton));
  card.addEventListener("dblclick", () => toggleLike(artwork, likeButton, true));

  return card;
}

function toggleLike(artwork, button, forceLike = false) {
  const alreadyLiked = Boolean(likes[artwork.id]);
  if (alreadyLiked && !forceLike) {
    delete likes[artwork.id];
  } else {
    likes[artwork.id] = {
      ...artwork,
      savedAt: new Date().toISOString(),
    };
  }

  writeLikes();
  updateLikeCount();
  renderBoard();
  syncAllLikeButtons();
}

function syncAllLikeButtons() {
  document.querySelectorAll(".artwork-card").forEach((card) => {
    const button = card.querySelector(".like-button");
    syncLikeButton(button, card.dataset.artworkId);
  });
}

function syncLikeButton(button, artworkId) {
  const isLiked = Boolean(likes[artworkId]);
  button.classList.toggle("is-liked", isLiked);
  button.setAttribute("aria-pressed", String(isLiked));
}

function renderBoard() {
  const likedItems = Object.values(likes).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  boardGrid.innerHTML = "";
  emptyBoard.classList.toggle("is-visible", likedItems.length === 0);

  const fragment = document.createDocumentFragment();
  likedItems.forEach((item) => {
    const card = document.createElement("a");
    card.className = "board-card";
    card.href = item.sourceUrl || item.imageUrl;
    card.target = "_blank";
    card.rel = "noreferrer";
    card.setAttribute("aria-label", `Open ${item.title || "work"} at the source`);
    card.innerHTML = `
      <img alt="${escapeHtml(item.title)}" src="${item.thumbnailUrl || item.imageUrl}" loading="lazy" />
      <div>
        <strong>${escapeHtml(item.title || "Untitled")}</strong>
        <span>${escapeHtml(item.artist || item.source || "")}</span>
      </div>
    `;
    fragment.append(card);
  });
  boardGrid.append(fragment);
}

function openBoard() {
  boardPanel.classList.add("is-open");
  boardPanel.setAttribute("aria-hidden", "false");
}

function closeBoard() {
  boardPanel.classList.remove("is-open");
  boardPanel.setAttribute("aria-hidden", "true");
}

function observeEnd(feedName) {
  const state = feedState[feedName];
  if (state.sentinel) {
    state.sentinel.disconnect();
  }

  state.sentinel = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        state.loadMore();
      }
    },
    { root: state.element, threshold: 0.4 },
  );

  const cards = state.element.querySelectorAll(".artwork-card");
  const target = cards[Math.max(cards.length - 3, 0)];
  if (target) {
    state.sentinel.observe(target);
  }
}

function setActiveFeed(feedName) {
  const index = feedName === "arena" ? 1 : 0;
  feedDeck.scrollTo({ left: feedDeck.clientWidth * index, behavior: "smooth" });
  activeFeedName = feedName;
  setStatus();
  updateEraSwitch();
}

function updateActiveFeedFromScroll() {
  const nextFeedName = feedDeck.scrollLeft > feedDeck.clientWidth * 0.5 ? "arena" : "classic";
  if (nextFeedName !== activeFeedName) {
    activeFeedName = nextFeedName;
    setStatus();
    updateEraSwitch();
  }
}

function getActiveFeed() {
  return feedState[activeFeedName].element;
}

function setStatus(message) {
  if (message) {
    sourceStatus.textContent = message;
    return;
  }

  const state = feedState[activeFeedName];
  if (activeFeedName === "arena") {
    sourceStatus.textContent = state.items.length
      ? `${state.items.length} Are.na images`
      : "Are.na research";
    return;
  }

  sourceStatus.textContent = state.items.length ? `${state.items.length} works loaded` : state.label;
}

function updateEraSwitch() {
  eraOptions.forEach((option) => {
    option.classList.toggle("is-active", option.dataset.era === activeFeedName);
  });
}

function renderLoader(feedElement) {
  const loader = document.createElement("div");
  loader.className = "loader-card";
  loader.dataset.loader = "true";
  loader.innerHTML = "<span aria-label=\"Loading\"></span>";
  feedElement.append(loader);
}

function removeLoader(feedElement) {
  feedElement.querySelectorAll("[data-loader]").forEach((loader) => loader.remove());
}

function resetFeed(feedName) {
  const state = feedState[feedName];
  if (state.sentinel) {
    state.sentinel.disconnect();
  }
  state.items = [];
  state.cursor = 0;
  state.element.innerHTML = "";
}

function readLikes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLikes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
}

function readArenaCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(ARENA_CACHE_KEY));
    if (!cached?.createdAt || Date.now() - cached.createdAt > ARENA_CACHE_AGE) {
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function writeArenaCache(items, channels) {
  localStorage.setItem(
    ARENA_CACHE_KEY,
    JSON.stringify({
      createdAt: Date.now(),
      items,
      channels: channels.map(({ slug, title, score, imageDensity, totalBlocks }) => ({
        slug,
        title,
        score,
        imageDensity,
        totalBlocks,
      })),
    }),
  );
}

function updateLikeCount() {
  likeCount.textContent = String(Object.keys(likes).length);
}

function resetSourceState() {
  sourceState.artic.page = randomInt(1, 80);
  sourceState.cleveland.skip = randomInt(0, 25000);
  sourceState.met.cursor = 0;
  sourceState.met.ids = [];
  sourceState.nga.cursor = 0;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || !item.imageUrl || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function weaveChannels(items) {
  const shuffled = shuffle(dedupe(items));
  const result = [];
  const queue = [...shuffled];

  while (queue.length) {
    const recent = result.slice(-2).map((item) => item.metadata?.channelSlug);
    const index = queue.findIndex(
      (item) =>
        !(recent.length === 2 &&
          recent[0] === recent[1] &&
          recent[0] === item.metadata?.channelSlug),
    );
    const nextIndex = index === -1 ? 0 : index;
    result.push(queue.splice(nextIndex, 1)[0]);
  }

  return result;
}

function randomizeArenaItems(items) {
  return weaveChannels(shuffle(items || []));
}

function getArenaResolutionScore(block) {
  const image = block.image || {};
  const fileSize = image.original?.file_size || 0;
  const displayUrl = image.display?.url || image.large?.url || image.original?.url || "";
  const sizeHint = displayUrl.includes("MTgwMA") ? 0.9 : displayUrl.includes("MTIwMA") ? 0.72 : 0.45;
  return Math.min(Math.max(fileSize / 800000, sizeHint), 1);
}

function getFreshnessScore(blocks) {
  const latestTime = Math.max(
    ...blocks.map((block) => new Date(block.connected_at || block.updated_at || block.created_at).getTime()),
  );
  if (!Number.isFinite(latestTime)) return 0.3;

  const ageDays = (Date.now() - latestTime) / (1000 * 60 * 60 * 24);
  return Math.max(0.15, Math.min(1, 1 - ageDays / 730));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOtherIndex(currentIndex, length) {
  if (length <= 1) return currentIndex;
  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = randomInt(0, length - 1);
  }
  return nextIndex;
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function cleanLine(value) {
  return value?.replace(/\s+/g, " ").trim();
}

function cleanTitle(value) {
  const title = cleanLine(value) || "Untitled";
  return title.replace(/\.(jpe?g|png|gif|webp)$/i, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

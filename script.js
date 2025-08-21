/**
* LEVEL 500 – Front page shows listing + episodes view
* ----------------------------------------------------
* Requirements covered:
* - Show a Shows Listing on load (name, image, summary, genres, status, rating, runtime)
* - Click a show → fetch episodes for that show, hide shows listing, show episodes view
* - Back link to shows listing
* - Show search (name, genres, summary) + Episode search/selector working as before
* - Cache responses so we never fetch the same URL more than once during a visit
*/

// ===== Global state (in-memory cache) =====
let allShows = [];                 // list of all shows
let showsLoaded = false;           // prevents refetching shows
const episodesCache = new Map();   // showId -> episodes[]
let allEpisodes = [];              // currently displayed show's episodes
let currentShowId = null;          // currently selected show id

// ===== DOM lookups (once) =====
const showsView = document.getElementById("shows-view");
const episodesView = document.getElementById("episodes-view");
const backToShowsBtn = document.getElementById("back-to-shows");
const navCurrent = document.getElementById("nav-current");

const showsRoot = document.getElementById("shows-root");
const showsCount = document.getElementById("shows-count");
const showSearchBox = document.getElementById("show-search-box");

const episodeRoot = document.getElementById("root");
const episodeCount = document.getElementById("title-count");
const episodeSearchBox = document.getElementById("search-box");
const episodeSelect = document.getElementById("title-select");
const showSelect = document.getElementById("select-show");

// ======== Utility helpers ========

/** Safely get image URL or a blank placeholder */
function getImage(srcObj) {
 return srcObj && srcObj.medium ? srcObj.medium : "";
}

/** Strip HTML tags for searching summaries */
function stripHtml(html = "") {
 return html.replace(/<[^>]*>/g, "");
}

/** Format SxxExx episode code */
function epCode({ season, number }) {
 const s = String(season ?? 0).padStart(2, "0");
 const n = String(number ?? 0).padStart(2, "0");
 return `S${s}E${n}`;
}

/** Create an <option> */
function opt(value, text) {
 const o = document.createElement("option");
 o.value = value;
 o.textContent = text;
 return o;
}

// ======== Shows: fetching, rendering, searching ========

/**
* Fetch all shows (once). Uses a simple flag to avoid refetching.
* The API returns many shows; we sort alphabetically for UX.
*/
async function fetchAllShowsOnce() {
 if (showsLoaded) return;

 showsRoot.textContent = "Loading shows...";
 try {
   // IMPORTANT: one fetch during a visit (no duplicate calls)
   const res = await fetch("https://api.tvmaze.com/shows");
   if (!res.ok) throw new Error("Failed to fetch shows.");
   const data = await res.json();

   // Sort alphabetically (case-insensitive)
   data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

   allShows = data;
   showsLoaded = true;
   renderShows(allShows);
 } catch (err) {
   console.error(err);
   showsRoot.textContent = "Error loading shows.";
 }
}

/** Render the shows grid with required fields */
function renderShows(list) {
 showsRoot.innerHTML = "";
 showsCount.textContent = `Displaying ${list.length} / ${allShows.length} shows`;

 list.forEach((show) => {
   const card = document.createElement("article");
   card.className = "show-card";
   card.innerHTML = `
     <img class="show-media" src="${getImage(show.image)}" alt="${show.name}" />
     <div class="show-body">
       <h3 class="show-title">${show.name}</h3>
       <div class="show-summary">${show.summary || "No summary available."}</div>
       <div class="show-meta">
         <span class="badge">${show.status}</span>
         <span class="badge">⭐ ${show.rating?.average ?? "N/A"}</span>
         <span class="badge">⏱ ${show.runtime ?? "N/A"}m</span>
       </div>
       <div class="show-meta"><strong>Genres:</strong> ${show.genres.join(", ")}</div>
     </div>
   `;
   // Clicking a show switches to episodes view for that show
   card.addEventListener("click", () => switchToEpisodes(show.id));
   showsRoot.appendChild(card);
 });
}

/** Show search: by name, summary, and genres */
function onShowSearchInput() {
 const q = showSearchBox.value.trim().toLowerCase();
 const filtered = allShows.filter((show) => {
   const name = show.name.toLowerCase().includes(q);
   const genres = show.genres.join(" ").toLowerCase().includes(q);
   const summary = (show.summary || "").toLowerCase().includes(q);
   return name || genres || summary;
 });
 renderShows(filtered);
}

// ======== Episodes: switching, fetching (with cache), rendering, search ========

/**
* Switches UI to the episodes view for a given show.
* Populates the top show <select> (Level 400 compatibility),
* fetches episodes (from cache if available), and renders.
*/
async function switchToEpisodes(showId) {
 currentShowId = String(showId);

 // Update navigation UI
 showsView.style.display = "none";
 episodesView.style.display = "block";
 backToShowsBtn.style.display = "inline-block";

 // Reflect current show in nav
 const show = allShows.find((s) => String(s.id) === currentShowId);
 navCurrent.textContent = show ? `Viewing: ${show.name}` : "";

 // Populate the show <select> if needed (sorted list)
 populateShowSelect();

 // Ensure the visible <select> matches current show
 showSelect.value = currentShowId;

 // Load episodes (from cache or fetch once)
 await ensureEpisodesLoaded(currentShowId);

 // Render initial episodes view and controls
 fillEpisodeSelect(allEpisodes);
 renderEpisodes(allEpisodes);
 episodeSearchBox.value = "";
 episodeSelect.value = "all";
}

/** Go back to the shows listing view */
function backToShows() {
 episodesView.style.display = "none";
 showsView.style.display = "block";
 backToShowsBtn.style.display = "none";
 navCurrent.textContent = "";
}

/** Populate the Show <select> (once) with all shows, alphabetically */
function populateShowSelect() {
 if (showSelect.dataset.filled === "1") return; // fill once per visit
 showSelect.innerHTML = "";
 showSelect.appendChild(opt("", "Select a show"));

 allShows.forEach((s) => {
   showSelect.appendChild(opt(String(s.id), s.name));
 });
 showSelect.dataset.filled = "1";
}

/**
* Ensure episodes for a show are loaded.
* Uses cache to avoid hitting the API more than once per show.
*/
async function ensureEpisodesLoaded(showId) {
 if (episodesCache.has(showId)) {
   allEpisodes = episodesCache.get(showId);
   return;
 }
 episodeRoot.innerHTML = "Loading episodes...";

 try {
   const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
   const res = await fetch(url);
   if (!res.ok) throw new Error("Failed to fetch episodes.");
   const data = await res.json();

   // Cache and expose
   episodesCache.set(showId, data);
   allEpisodes = data;
 } catch (err) {
   console.error(err);
   episodeRoot.innerHTML = "Error loading episodes.";
 }
}

/** Build the Episode <select> list (All + each episode by SxxExx - Name) */
function fillEpisodeSelect(list) {
 episodeSelect.innerHTML = "";
 episodeSelect.appendChild(opt("all", "Show All Episodes"));
 list.forEach((ep) => {
   episodeSelect.appendChild(opt(String(ep.id), `${epCode(ep)} - ${ep.name}`));
 });
}

/** Render episodes grid + update count */
function renderEpisodes(list) {
 episodeRoot.innerHTML = "";
 episodeCount.textContent = `Displaying ${list.length} / ${allEpisodes.length} episodes`;

 list.forEach((ep) => {
   const card = document.createElement("article");
   card.className = "episode-card";
   const img = getImage(ep.image);

   card.innerHTML = `
     <h3><strong>${epCode(ep)}</strong> - ${ep.name}</h3>
     ${img ? `<img src="${img}" alt="${ep.name}">` : ""}
     <div class="summary">${ep.summary || "No summary available."}</div>
     <a href="${ep.url}" target="_blank" rel="noopener">View on TVMaze.com</a>
   `;
   episodeRoot.appendChild(card);
 });
}
/** Filter episodes by title or summary (free text) */
function filterEpisodes(q) {
 const query = q.toLowerCase();
 return allEpisodes.filter((ep) => {
   const name = ep.name.toLowerCase().includes(query);
   const sum = stripHtml(ep.summary || "").toLowerCase().includes(query);
   return name || sum;
 });
}

// ======== Event wiring ========

// Back button
backToShowsBtn.addEventListener("click", backToShows);

// Show search box
showSearchBox.addEventListener("input", onShowSearchInput);

// Change show from <select> in episodes view (quick switch)
showSelect.addEventListener("change", async (e) => {
 const newId = e.target.value;
 if (!newId) return;
 await switchToEpisodes(newId);
});

// Episode select (show one or all)
episodeSelect.addEventListener("change", () => {
 const val = episodeSelect.value;
 if (val === "all") {
   renderEpisodes(allEpisodes);
   return;
 }
 const found = allEpisodes.find((ep) => String(ep.id) === val);
 renderEpisodes(found ? [found] : []);
});

// Episode search box
episodeSearchBox.addEventListener("input", () => {
 const filtered = filterEpisodes(episodeSearchBox.value);
 renderEpisodes(filtered);
});

// ======== App start (shows listing first) ========
window.onload = () => {
 // Load shows once and render shows listing view
 fetchAllShowsOnce();
};



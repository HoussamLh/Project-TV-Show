// Global references
let allEpisodes = [];
let allShows = [];
let showCache = {}; // Cache episodes per show ID

// Entry point
async function initializeApp() {
  await fetchAndPopulateShows();
  setupShowSelector();
}

// Fetch list of shows and populate dropdown
async function fetchAndPopulateShows() {
  const response = await fetch("https://api.tvmaze.com/shows");
  const shows = await response.json();

  // Sort alphabetically (case-insensitive)
  shows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  allShows = shows;

  const showSelect = document.getElementById("showSelect");
  showSelect.innerHTML = ""; // Clear loading text

  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelect.appendChild(option);
  });

  // Load first show by default
  if (shows.length > 0) {
    loadShowEpisodes(shows[0].id);
  }
}

// Fetch episodes for a selected show
async function loadShowEpisodes(showId) {
  if (showCache[showId]) {
    allEpisodes = showCache[showId];
  } else {
    const response = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
    const episodes = await response.json();
    showCache[showId] = episodes;
    allEpisodes = episodes;
  }

  renderEpisodesList(allEpisodes);
  setupSearch();
  setupEpisodeSelector();
}

// Handle show selection
function setupShowSelector() {
  const showSelect = document.getElementById("showSelect");
  showSelect.addEventListener("change", (e) => {
    const showId = e.target.value;
    if (showId) {
      loadShowEpisodes(showId);
    }
  });
}

// Renders all episodes to the page
function renderEpisodesList(episodeList) {
  const rootElem = document.getElementById("root");
  const template = document.getElementById("template");

  // Clear existing content
  rootElem.innerHTML = "";

  episodeList.forEach((episode) => {
    const episodeCard = createEpisodeCard(template, episode);
    episodeCard.id = `episode-${episode.id}`; // Unique ID for scrolling
    rootElem.appendChild(episodeCard);
  });

  // Update count
  updateEpisodeCount(episodeList.length);
}

// Creates a single episode card from template
function createEpisodeCard(template, episode) {
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector("section");

  // Title
  card.querySelector("h2").textContent = episode.name;

  // Season/Episode
  card.querySelector(".seasonAndEpisode").textContent = formatEpisodeCode(
    episode.season,
    episode.number
  );

  // Image
  const image = card.querySelector("img");
  if (episode.image) {
    image.src = episode.image.medium;
    image.alt = `Still from "${episode.name}" (S${episode.season}, E${episode.number})`;
  } else {
    image.src = "";
    image.alt = "No image available";
  }

  // Summary
  card.querySelector(".summary").innerHTML =
    episode.summary || "No summary available.";

  return card;
}

// Formats S01E01
function formatEpisodeCode(season, number) {
  const seasonPadded = season.toString().padStart(2, "0");
  const episodePadded = number.toString().padStart(2, "0");
  return `S${seasonPadded}E${episodePadded}`;
}

// Updates displayed episode count
function updateEpisodeCount(count) {
  let counterElem = document.getElementById("searchCount");
  if (!counterElem) {
    counterElem = document.createElement("p");
    counterElem.id = "searchCount";
    const header = document.querySelector("header");
    header.appendChild(counterElem);
  }
  counterElem.textContent = `Displaying ${count} / ${allEpisodes.length} episodes`;
}

// Sets up live search
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredEpisodes = allEpisodes.filter((episode) => {
      const nameMatch = episode.name.toLowerCase().includes(searchTerm);
      const summaryMatch = episode.summary
        ? episode.summary.toLowerCase().includes(searchTerm)
        : false;
      return nameMatch || summaryMatch;
    });
    renderEpisodesList(filteredEpisodes);
  });
}

// Sets up episode selector dropdown
function setupEpisodeSelector() {
  const selectElem = document.getElementById("episodeSelect");

  // Clear old options
  selectElem.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Show All Episodes";
  selectElem.appendChild(allOption);

  // Populate dropdown with episodes
  allEpisodes.forEach((episode) => {
    const seasonStr = String(episode.season).padStart(2, "0");
    const numberStr = String(episode.number).padStart(2, "0");
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `S${seasonStr}E${numberStr} - ${episode.name}`;
    selectElem.appendChild(option);

  });

  
  selectElem.addEventListener("change", (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "all") {
      renderEpisodesList(allEpisodes);
      return;
    }
    const selectedEpisode = allEpisodes.find((ep) => ep.id == selectedValue);
    if (selectedEpisode) {
      renderEpisodesList([selectedEpisode]);
      setTimeout(() => {
        const epElem = document.getElementById(`episode-${selectedEpisode.id}`);
        if (epElem)
          epElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  });
}

// Run app on load
window.onload = initializeApp;
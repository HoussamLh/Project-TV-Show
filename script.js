// script.js
// You can edit ALL of the code here

// Store all episodes globally
const allEpisodes = getAllEpisodes();

function setup() {
  makePageForEpisodes(allEpisodes);
  populateEpisodeSelector(allEpisodes);

  // Add event listeners for the search and selector
  document.getElementById("search").addEventListener("input", handleSearch);
  document.getElementById("episode-selector").addEventListener("change", handleEpisodeSelect);
}

// Renders the episodes to the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear existing content

  episodeList.forEach(episode => {
    const episodeCard = document.createElement("div");
    episodeCard.classList.add("episode-card");

    // Format episode number as S01E01
    const seasonNumber = episode.season.toString().padStart(2, '0');
    const episodeNumber = episode.number.toString().padStart(2, '0');
    const episodeCode = `S${seasonNumber}E${episodeNumber}`;

    episodeCard.innerHTML = `
      <div class="episode-header">
        <h2>${episodeCode} - ${episode.name}</h2>
      </div>
      <img src="${episode.image.medium}" alt="${episode.name}">
      <div class="summary-text">${episode.summary}</div>
    `;

    rootElem.appendChild(episodeCard);
  });

  // Update the episode count
  document.getElementById("episode-count").textContent = `Displaying ${episodeList.length}/${allEpisodes.length} episodes`;
}

// Populates the dropdown menu with all episodes
function populateEpisodeSelector(episodeList) {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = ""; // Clear existing options

  // Add a "Show All Episodes" option
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show All Episodes";
  selector.appendChild(defaultOption);

  episodeList.forEach(episode => {
    const option = document.createElement("option");
    const seasonNumber = episode.season.toString().padStart(2, '0');
    const episodeNumber = episode.number.toString().padStart(2, '0');
    option.value = `S${seasonNumber}E${episodeNumber}`;
    option.textContent = `S${seasonNumber}E${episodeNumber} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// Handles the search input
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();

  const filteredEpisodes = allEpisodes.filter(episode => {
    return (
      episode.name.toLowerCase().includes(searchTerm) ||
      episode.summary.toLowerCase().includes(searchTerm)
    );
  });

  makePageForEpisodes(filteredEpisodes);
}

// Handles the episode selector
function handleEpisodeSelect(event) {
  const selectedCode = event.target.value;

  if (selectedCode === "all") {
    makePageForEpisodes(allEpisodes);
  } else {
    const selectedEpisode = allEpisodes.find(episode => {
      const seasonNumber = episode.season.toString().padStart(2, '0');
      const episodeNumber = episode.number.toString().padStart(2, '0');
      return `S${seasonNumber}E${episodeNumber}` === selectedCode;
    });

    if (selectedEpisode) {
      makePageForEpisodes([selectedEpisode]);
    }
  }
}

window.onload = setup;
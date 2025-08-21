// Global variables to store data

let allEpisodes = [];
let allShows = [];
let episodesCache = {};

// fetch all tv shows from TVMaza API, and fill in select-show dropdown
function fetchAllShows() {
  const showSelect = document.getElementById("select-show");
  showSelect.innerHTML = "";
  showSelect.appendChild(createOption("", "loading shows..."));

  fetch("https://api.tvmaze.com/shows")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to fetch TV shows. Please try again later.");
      }
      return response.json();
    })
    .then(function (data) {
      allShows = data;
      // sort shows in alhabeticall order by name
      allShows.sort(function (a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
      // why ?
      showSelect.innerHTML = `<option value = "">Select a show</option>`;

      // fill "select-show" dropdown
      allShows.forEach(function (show) {
        const option = document.createElement("option");
        option.value = show.id;
        option.innerHTML = show.name;
        showSelect.appendChild(option);
      });

      // Automatically select first show and load episodes
      if (allShows.length > 0) {
        showSelect.value = allShows[0].id;
        showSelect.dispatchEvent(new Event("change"));
      }
    })
    .catch(function (error) {
      // show error if shows failed to appear in dropdown
      showSelect.innerHTML = `<option value = "">Error loading shows</option>`;
      console.error("Fetch error:", error);
    });
}

// When the show dropdown changes, fetch or use cached episodes
document.getElementById("select-show").addEventListener("change", function () {
  const showId = this.value;
  if (!showId) return; // do nothing if no show selected

  if (episodesCache[showId]) {
    allEpisodes = episodesCache[showId];
    fillTitleDropdown(allEpisodes);
    makePageForEpisodes(allEpisodes);
  } else {
    const selectElem = document.getElementById("title-select");
    selectElem.innerHTML = "";
    selectElem.appendChild(createOption("", "loading episodes..."));

    fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      .then(function (response) {
        if (!response.ok)
          throw new Error("Failed to fetch episodes for this show.");
        return response.json();
      })
      .then(function (data) {
        episodesCache[showId] = data;
        allEpisodes = data;
        fillTitleDropdown(allEpisodes);
        makePageForEpisodes(allEpisodes);
      })
      .catch(function (error) {
        selectElem.innerHTML = "";
        selectElem.appendChild(createOption("", "Error loading episodes"));
        const rootElem = document.getElementById("root");
        rootElem.textContent =
          "Sorry, there was an error loading the episodes.";
        console.error("Fetch error:", error);
      });
  }
});
// helper function
function createElement(tag, className, content) {
  const elem = document.createElement(tag);
  if (className) elem.className = className;
  if (content) elem.innerHTML = content;
  return elem;
}
// format episodes code i.e "S01E05"
function formatEpisodeCode(episode) {
  const seasonStr = String(episode.season).padStart(2, "0");
  const numberStr = String(episode.number).padStart(2, "0");
  return `S${seasonStr}E${numberStr}`;
}
// Remove html tags from strings. Used when searching summaries
function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, "");
}
//when is this used ?
function createOption(value, text) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  return opt;
}

// Display episode on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.textContent = "";
  rootElem.className = "episodes-grid";

  const countElem = document.getElementById("title-count");
  countElem.textContent = `Displaying ${episodeList.length} / ${allEpisodes.length} episodes`;

  episodeList.forEach((episode) => {
    const episodeSection = createElement("section", "episode-card");
    const episodeCode = formatEpisodeCode(episode);

    episodeSection.appendChild(
      createElement(
        "h3",
        "",
        `<strong>${episodeCode}</strong> - ${episode.name}`
      )
    );

    if (episode.image && episode.image.medium) {
      const imgElem = createElement("img");
      imgElem.src = episode.image.medium;
      imgElem.alt = episode.name;
      episodeSection.appendChild(imgElem);
    }

    const summaryElem = createElement(
      "div",
      "",
      episode.summary || "No summary available."
    );
    episodeSection.appendChild(summaryElem);

    const linkElem = createElement("a");
    linkElem.href = episode.url;
    linkElem.target = "_blank";
    linkElem.textContent = "View on TVMaze.com";
    episodeSection.appendChild(linkElem);

    rootElem.appendChild(episodeSection);
  });
}
// fill the episode dropdown
function fillTitleDropdown(allEpisodes) {
  const selectElem = document.getElementById("title-select");
  selectElem.innerHTML = "";
  selectElem.appendChild(createOption("all", "Show All Episodes"));

  allEpisodes.forEach((episode) => {
    const episodeCode = formatEpisodeCode(episode);
    selectElem.appendChild(
      createOption(episode.id, `${episodeCode} - ${episode.name}`)
    );
  });
}
// filter shows based on user input
function filterEpisodes(searchValue) {
  return allEpisodes.filter((episode) => {
    const matchedTitle = episode.name.toLowerCase().includes(searchValue);
    const summaryMatch = episode.summary
      ? stripHtmlTags(episode.summary).toLowerCase().includes(searchValue)
      : false;
    return matchedTitle || summaryMatch;
  });
}
// when an episode gets selected from dropdown, then  show that episode
document.getElementById("title-select").addEventListener("change", function () {
  const value = this.value;
  if (value === "all") makePageForEpisodes(allEpisodes);
  else {
    const episode = allEpisodes.find((e) => e.id == value);
    makePageForEpisodes([episode]);
  }
});
// search box input event
document.getElementById("search-box").addEventListener("input", function () {
  const searchValue = this.value.toLowerCase();
  const result = filterEpisodes(searchValue);
  makePageForEpisodes(result);
});

// load shows on page load
window.onload = function () {
  fetchAllShows();
};

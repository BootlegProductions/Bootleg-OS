// BOOTLEG OS // Shared Pirate Radio player
(function () {
  const stations = window.BOOTLEG_RADIO_STATIONS || [];
  if (!stations.length) return;

  const state = {
    stationIndex: Number(localStorage.getItem("bootlegRadioStation") ?? stations.findIndex(station => station.id === "oldies")),
    trackIndex: Number(localStorage.getItem("bootlegRadioTrack") || 0),
    playing: false,
    wantsPlayback: sessionStorage.getItem("bootlegRadioWanted") === "1",
    volume: Number(localStorage.getItem("bootlegRadioVolume") || 0.7),

    // Mini-radio dial animation state
    tuningRotation: 0,
    powerRotation: 0
  };

  state.stationIndex = clampIndex(state.stationIndex, stations.length);
  state.trackIndex = clampIndex(
    state.trackIndex,
    stations[state.stationIndex].tracks.length
  );

  const audio = new Audio();
  audio.preload = "metadata";
  // Archive audio does not need CORS. Requiring it makes playable files fail.
  audio.volume = state.volume;
  document.body.appendChild(audio);

  function clampIndex(index, length) {
    if (!length) return 0;
    return ((index % length) + length) % length;
  }

  function currentStation() {
    return stations[state.stationIndex];
  }

  function currentTrack() {
    const station = currentStation();
    return station.tracks[state.trackIndex] || station.tracks[0];
  }

  let loadTimer;
  let loadingId = 0;
  let attempted = new Set();
  let lastProgress = 0;
  const LOAD_TIMEOUT = 18000;
  function stopWatchdog() { clearTimeout(loadTimer); }
  function watchPlayback(id = loadingId) {
    stopWatchdog();
    lastProgress = audio.currentTime || 0;
    loadTimer = setTimeout(() => {
      if (id !== loadingId || !state.wantsPlayback) return;
      if (audio.currentTime > lastProgress + 0.5) { watchPlayback(id); return; }
      skipUnavailable(id, "Archive audio stalled");
    }, LOAD_TIMEOUT);
  }
  function skipUnavailable(id, reason) {
    if (id !== loadingId || !state.wantsPlayback) return;
    const station = currentStation();
    attempted.add(state.trackIndex);
    // Do not churn through an entire station if the Archive is offline.
    if (attempted.size >= Math.min(6, station.tracks.length)) {
      stopWatchdog();
      state.wantsPlayback = false;
      sessionStorage.setItem("bootlegRadioWanted", "0");
      audio.pause();
      state.playing = false;
      updateDisplays("Several tracks failed · try another station");
      return;
    }
    state.trackIndex = clampIndex(state.trackIndex + 1, station.tracks.length);
    updateDisplays(reason + " · trying next track");
    loadTrack(true);
  }
  function savePosition() {
    localStorage.setItem("bootlegRadioStation", state.stationIndex);
    localStorage.setItem("bootlegRadioTrack", state.trackIndex);
    if (Number.isFinite(audio.currentTime)) localStorage.setItem("bootlegRadioTime", String(audio.currentTime));
  }

  function loadTrack(autoplay = false, restore = false) {
    const track = currentTrack();
    if (!track) return;
    stopWatchdog();
    const id = ++loadingId;
    if (!restore) localStorage.setItem("bootlegRadioTime", "0");
    const savedTime = restore ? Number(localStorage.getItem("bootlegRadioTime") || 0) : 0;
    audio.pause();
    state.playing = false;
    audio.src = track.url;
    audio.load();
    if (savedTime > 0) {
      audio.addEventListener("loadedmetadata", function seek() {
        if (id !== loadingId) return;
        if (savedTime < audio.duration - 1) audio.currentTime = savedTime;
      }, { once: true });
    }

    localStorage.setItem(
      "bootlegRadioStation",
      state.stationIndex
    );

    localStorage.setItem(
      "bootlegRadioTrack",
      state.trackIndex
    );

    updateDisplays();

    if (autoplay) play();
  }

  function play() {
    const track = currentTrack();
    if (!track) return;

    if (!audio.src) {
      loadTrack(false);
    }

    state.wantsPlayback = true;
    sessionStorage.setItem("bootlegRadioWanted", "1");
    updateDisplays("TUNING...");
    watchPlayback();
    const id = loadingId;
    audio
      .play()
      .then(() => {
        if (id !== loadingId) return;
        state.playing = true;
        updateDisplays();
      })
      .catch(error => {
        if (id !== loadingId || !state.wantsPlayback) return;
        state.playing = false;
        if (error.name === "NotAllowedError") {
          stopWatchdog();
          updateDisplays("Tap Play to resume audio");
        } else if (error.name !== "AbortError") {
          skipUnavailable(id, "Archive file failed");
        }
      });
  }

  function pause() {
    state.wantsPlayback = false;
    sessionStorage.setItem("bootlegRadioWanted", "0");
    audio.pause();
    stopWatchdog();
    savePosition();
    state.playing = false;
    updateDisplays();
  }

  function togglePlay() {
    state.playing ? pause() : play();
  }

  function nextTrack() {
    const station = currentStation();
    attempted.clear();

    state.trackIndex = clampIndex(
      state.trackIndex + 1,
      station.tracks.length
    );

    loadTrack(state.wantsPlayback);
  }

  function prevTrack() {
    const station = currentStation();
    attempted.clear();

    state.trackIndex = clampIndex(
      state.trackIndex - 1,
      station.tracks.length
    );

    loadTrack(state.wantsPlayback);
  }

function spinTuningDial(direction = 1) {
  state.tuningRotation += 90 * direction;

  document
    .querySelectorAll(
      ".mini-radio .tuning-dial .dial-rotator, [data-radio-tune-dial]"
    )
    .forEach(el => {
      el.style.transform = `translate(-50%, -50%) rotate(${state.tuningRotation}deg)`;
    });
}

  function tuneStation(direction = 1) {
    attempted.clear();
    state.stationIndex = clampIndex(
      state.stationIndex + direction,
      stations.length
    );

    state.trackIndex = 0;

    spinTuningDial(direction);

    loadTrack(state.wantsPlayback);

    refreshActiveCards();
  }

  function setPowerDial(isOn) {
    /*
      Power/volume knob simply flicks between:

      OFF = 0 degrees
      ON  = 60 degrees

      Change 60 to -60 if you want it
      to flick in the opposite direction.
    */
    state.powerRotation = isOn ? 60 : 0;

    document
      .querySelectorAll(".mini-radio .volume-dial .dial-rotator")
      .forEach(knob => {
        knob.style.transform =
          `translate(-50%, -50%) rotate(${state.powerRotation}deg)`;
      });
  }

  function changeVolume(delta) {
    state.volume = Math.min(
      1,
      Math.max(0, state.volume + delta)
    );

    audio.volume = state.volume;

    localStorage.setItem(
      "bootlegRadioVolume",
      state.volume.toFixed(2)
    );

    updateDisplays();
  }

  function updateDisplays(message = "") {
    const station = currentStation();
    const track = currentTrack();

    const stationText = station.name.toUpperCase();
    const trackText = track
      ? track.title
      : "No track loaded";

    document
      .querySelectorAll(
        ".mini-radio .frequency, [data-radio-frequency]"
      )
      .forEach(el => {
        el.textContent = station.frequency;
      });

    document
      .querySelectorAll(
        ".mini-radio .station, [data-radio-station]"
      )
      .forEach(el => {
        el.textContent = stationText;
      });

    document
      .querySelectorAll("[data-radio-track]")
      .forEach(el => {
        el.textContent = trackText;
      });

    document
      .querySelectorAll("[data-radio-status]")
      .forEach(el => {
        el.textContent =
          message ||
          (state.playing ? "ON AIR" : "STANDBY");
      });
    document.querySelectorAll("[data-radio-status-short]").forEach(el => {
      el.textContent = message || (state.playing ? "ON AIR" : state.wantsPlayback ? "READY · tap Play" : "STANDBY");
    });

    document
      .querySelectorAll("[data-radio-volume]")
      .forEach(el => {
        el.textContent =
          `${Math.round(state.volume * 100)}%`;
      });

    document
      .querySelectorAll("[data-radio-play]")
      .forEach(el => {
        el.textContent =
          state.playing ? "Pause" : "Play";
      });
    document.querySelectorAll('.mobile-radio-stations [data-select-station]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.selectStation)===state.stationIndex)));
    const mobileVolume=document.querySelector('.mobile-radio-volume');if(mobileVolume)mobileVolume.value=String(Math.round(state.volume*100));
    document.querySelectorAll('.mobile-radio [data-play-radio]').forEach(el=>el.setAttribute('aria-label',state.playing?'Pause radio':'Play radio'));

  }

  function renderStations() {
    const list = document.querySelector(
      "[data-station-list]"
    );

    if (!list) return;

    list.innerHTML = stations
      .map(
        (station, index) => `
          <article
            class="card radio-station-card ${
              index === state.stationIndex
                ? "is-active"
                : ""
            }"
            data-station-card="${index}"
          >
            <div class="card-content">
              <span class="eyebrow">
                ${station.frequency}
              </span>

              <h3>${station.name}</h3>

              <p>${station.tagline}</p>

              <p>
                <strong>${station.tracks.length}</strong>
                archive tracks loaded
              </p>

              <button
                class="btn"
                data-select-station="${index}"
              >
                Tune station
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function refreshActiveCards() {
    document
      .querySelectorAll("[data-station-card]")
      .forEach(card => {
        card.classList.toggle(
          "is-active",
          Number(card.dataset.stationCard) ===
            state.stationIndex
        );
      });
  }

  function bindControls() {
    document.addEventListener("click", event => {
      const play = event.target.closest(
        "[data-play-radio]"
      );

      if (play) {
        togglePlay();
      }

      /*
        MINI RADIO LEFT DIAL
        Acts as power/play toggle.

        OFF -> 0deg
        ON  -> 60deg
      */
      const powerDial = event.target.closest(
        ".mini-radio .volume-dial"
      );

      if (powerDial) {
        const turningOn = !state.playing;

        setPowerDial(turningOn);

        togglePlay();
      }

      const next = event.target.closest(
        "[data-next-track]"
      );

      if (next) {
        nextTrack();
      }

      const prev = event.target.closest(
        "[data-prev-track]"
      );

      if (prev) {
        prevTrack();
      }

      /*
        MINI RADIO RIGHT DIAL
        Quarter-turn whenever
        changing station.
      */
      const tune = event.target.closest(
        "[data-tune-next], .tuning-dial"
      );

      if (
        tune &&
        !tune.matches("[data-select-station]")
      ) {
        tuneStation(1);
      }

      const volUp = event.target.closest(
        "[data-volume-up]"
      );

      if (volUp) {
        changeVolume(0.1);
      }

      const volDown = event.target.closest(
        "[data-volume-down]"
      );

      if (volDown) {
        changeVolume(-0.1);
      }

      const select = event.target.closest(
        "[data-select-station]"
      );

      if (select) {
        attempted.clear();
        state.stationIndex = clampIndex(
          Number(select.dataset.selectStation),
          stations.length
        );

        state.trackIndex = 0;

        /*
          Give the tuning dial one full spin
          when selecting a station from the
          full radio page too.
        */
        spinTuningDial(1);

        loadTrack(state.wantsPlayback);

        refreshActiveCards();
      }
    });

    audio.addEventListener("ended", () => {
      attempted.clear();
      const station = currentStation();

      state.trackIndex = clampIndex(
        state.trackIndex + 1,
        station.tracks.length
      );

      localStorage.setItem(
        "bootlegRadioTrack",
        state.trackIndex
      );

      loadTrack(true);
    });

    audio.addEventListener("timeupdate", () => {
      if (audio.currentTime > lastProgress + 0.5) {
        attempted.clear();
        if (state.wantsPlayback) watchPlayback();
      }
      if (Math.floor(audio.currentTime) % 3 === 0) savePosition();
    });
    audio.addEventListener("error", () => {
      skipUnavailable(loadingId, "Archive file failed");
    });
    audio.addEventListener("stalled", () => { if (state.wantsPlayback) watchPlayback(); });
    audio.addEventListener("waiting", () => { if (state.wantsPlayback) watchPlayback(); });
    audio.addEventListener("playing", () => { if (state.wantsPlayback) watchPlayback(); });

    audio.addEventListener("play", () => {
      state.playing = true;

      setPowerDial(true);

      updateDisplays();
    });

    audio.addEventListener("pause", () => {
      state.playing = false;

      setPowerDial(false);

      updateDisplays();
    });
  }

  window.addEventListener("beforeunload", () => {
    savePosition();
  });

  // A shared mobile drawer uses this same Audio instance and existing controls.
  const dock=document.createElement('section');dock.className='mobile-radio';dock.setAttribute('aria-label','Pirate Radio player');
  dock.innerHTML=`<button class="mobile-radio-handle" type="button" aria-expanded="false" aria-controls="mobile-radio-details" aria-label="Expand radio player"><span aria-hidden="true">━━</span><span class="mobile-radio-hint">Radio · swipe up</span></button>
  <div class="mobile-radio-bar"><div class="mobile-radio-copy"><strong data-radio-station></strong><span data-radio-track></span><small data-radio-status-short role="status"></small></div><button type="button" data-play-radio data-radio-play>Play</button><button type="button" data-next-track aria-label="Next track">Next</button><button type="button" class="mobile-radio-switch" aria-label="Show station controls">Stations</button></div>
  <div id="mobile-radio-details" class="mobile-radio-details" hidden><p data-radio-status role="status"></p><div class="mobile-radio-stations"></div><label>Volume <input class="mobile-radio-volume" type="range" min="0" max="100" value="${Math.round(state.volume*100)}"><span data-radio-volume></span></label></div>`;
  document.body.append(dock);
  const stationButtons=dock.querySelector('.mobile-radio-stations');stations.forEach((station,index)=>{const button=document.createElement('button');button.type='button';button.dataset.selectStation=String(index);button.textContent=station.name;stationButtons.append(button)});
  const handle=dock.querySelector('.mobile-radio-handle'),details=dock.querySelector('.mobile-radio-details');
  function expandRadio(expanded){details.hidden=!expanded;handle.setAttribute('aria-expanded',String(expanded));handle.setAttribute('aria-label',expanded?'Collapse radio player':'Expand radio player');dock.classList.toggle('expanded',expanded);document.body.classList.toggle('mobile-radio-expanded',expanded);dock.querySelector('.mobile-radio-hint').textContent=expanded?'Radio · swipe down':'Radio · swipe up';}
  handle.addEventListener('click',()=>{if(!skipClick)expandRadio(details.hidden);skipClick=false});
  dock.querySelector('.mobile-radio-switch').addEventListener('click',()=>expandRadio(details.hidden));
  let startY=0,skipClick=false;
  handle.addEventListener('pointerdown',e=>{startY=e.clientY;skipClick=false;handle.setPointerCapture(e.pointerId)});
  handle.addEventListener('pointerup',e=>{const delta=e.clientY-startY;if(Math.abs(delta)>25){skipClick=true;expandRadio(delta<0)}});
  handle.addEventListener('pointercancel',()=>{skipClick=false});
  dock.querySelector('.mobile-radio-volume').addEventListener('input',e=>changeVolume(Number(e.target.value)/100-state.volume));

  renderStations();
  bindControls();

  loadTrack(state.wantsPlayback, true);

  updateDisplays();
})();


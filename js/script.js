let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Harry</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())

        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track
    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    console.log("Displaying albums");
    try {
        let a = await fetch(`/songs/`);
        if (!a.ok) {
            throw new Error(`Failed to fetch /songs/ directory. Status: ${a.status}`);
        }
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors);
        let htmlContent = "";

        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").filter(part => part).pop();
                if (!folder) {
                    console.warn(`Empty folder name extracted from href: ${e.href}`);
                    continue;
                }
                try {
                    console.log(`Fetching info.json for folder: ${folder}`);
                    let infoResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!infoResponse.ok) {
                        console.error(`Failed to fetch info.json for folder: ${folder}. Status: ${infoResponse.status}`);
                        continue;
                    }
                    let info = await infoResponse.json();
                    htmlContent += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="42" height="42">
                                <circle cx="14" cy="14" r="14" fill="#1ed760" />
                                <path
                                    d="M18.8906 14.846C18.5371 16.189 16.8667 17.138 13.5257 19.0361C10.296 20.8709 8.6812 21.7884 7.37983 21.4196C6.8418 21.2671 6.35159 20.9776 5.95624 20.5787C5 19.6139 5 17.7426 5 14C5 10.2574 5 8.3861 5.95624 7.42132C6.35159 7.02245 6.8418 6.73288 7.37983 6.58042C8.6812 6.21165 10.296 7.12907 13.5257 8.96393C16.8667 10.86197 18.5371 11.811 18.8906 13.154C19.0365 13.7084 19.0365 14.2916 18.8906 14.846Z"
                                    fill="black" transform="translate(5, 4) scale(0.75)" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="${info.title} Cover">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (error) {
                    console.error(`Error fetching/parsing info.json for folder: ${folder}`, error);
                }
            }
        }
        cardContainer.innerHTML = htmlContent;

        // Load the playlist whenever a card is clicked
        cardContainer.addEventListener("click", async (event) => {
            const card = event.target.closest(".card");
            if (card) {
                const folder = card.dataset.folder;
                if (folder) {
                    console.log("Fetching Songs for folder:", folder);
                    songs = await getSongs(`songs/${folder}`);
                    if (songs.length > 0) {
                        playMusic(songs[0]);
                    } else {
                        console.warn(`No songs found in folder: ${folder}`);
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error in displayAlbums:", error);
    }
}

async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs")
    playMusic(songs[0], true)

    // Display all the albums on the page
    await displayAlbums()

    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        currentSong.pause()
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
        else {
            playMusic(songs[songs.length - 1])
        }
    })

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause()
        console.log("Next clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
        if ((index + 1) == songs.length) {
            playMusic(songs[0]);
        }
    })

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100")
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    })

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    // Add an event listener to play the next song when currentSong completes its playing
    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });
    
}

main() 
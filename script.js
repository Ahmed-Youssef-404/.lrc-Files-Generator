let audio = document.getElementById('audio');
let lyrics = [];

document.getElementById('audioFile').addEventListener('change', function (event) {
    let file = event.target.files[0];
    if (file) {
        audio.src = URL.createObjectURL(file);
    }
});

// تقديم وتأخير 3 ثواني
function skip(seconds) {
    audio.currentTime += seconds;
}

// تشغيل أو إيقاف الصوت
let btn = document.getElementById('playPauseBtn');
function togglePlay() {
    if (fileInput.files.length > 0) {
        
        if (audio.paused) {
            audio.play();
            btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            audio.pause();
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }
}

// لما الصوت ينتهي
audio.addEventListener("play", () => {
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
});

audio.addEventListener("pause", () => {
    btn.innerHTML = '<i class="fa-solid fa-play"></i>';
});

function loadLyrics() {
    let inputText = document.getElementById('lyricsInput').value;
    let lines = inputText.split('\n').map(line => line.trim()).filter(line => line !== "");

    let updatedLyrics = [];
    lines.forEach((line, index) => {
        let existingLyric = lyrics.find(l => l.text === line);
        if (existingLyric) {
            updatedLyrics.push(existingLyric);
        } else {
            updatedLyrics.push({ text: line, timestamp: null });
        }
    });

    lyrics = updatedLyrics;
    updateLyricsDisplay();
}



// --------------------------------------------------------------------------



function updateLyricsDisplay() {
    let container = document.getElementById('lyricsContainer');
    container.innerHTML = '';

    lyrics.forEach((lyric, index) => {
        let div = document.createElement('div');
        div.classList.add('lyric-line');
        div.innerHTML = `
            <input type="text" value="${lyric.text}" id="lyric-text-${index}" class="lyric-input" onblur="confirmEdit(${index})" dir="auto">
            <div class="lyricControls">
                <button onclick="setTimestamp(${index})"><i class="fa-solid fa-clock"></i></button>
                <button onclick="playFrom(${index})"><i class="fa-solid fa-play"></i></button>
                <span id="time-${index}" onclick="manualEditTime(${index})">
                    ${lyric.timestamp ? formatTime(lyric.timestamp) : "[00:00.00]"}
                </span>
                <button onclick="showPupUp(${index})"><i class="fa-solid fa-pencil"></i></button>
            </div>       
            
        `;
        container.appendChild(div);
    });

   

    updateTextarea();
}

// --------------------------------------



function showPupUp(index) {
    let popup = document.getElementById('popup');
    let currentText = lyrics[index].text;
    let currentTimestamp = lyrics[index].timestamp || 0;
    
    popup.classList.add("popup");
    popup.classList.remove("hide");

    popup.innerHTML = `
        <div class="popup-content">
            <div class="editPupUp">
                <label for="edit-text">Edit Text:</label>
                <input type="text" id="edit-text" value="${currentText}">
            </div>


            <div class="editPupUp">
                <label for="edit-minutes">Minute</label>
                <input type="number" id="edit-minutes" value="${Math.floor(currentTimestamp / 60)}" min="0">
            </div>

            <div class="editPupUp">
                <label for="edit-seconds">Second</label>
                <input type="number" id="edit-seconds" value="${Math.floor(currentTimestamp % 60)}" min="0" max="59">
            </div>

            <div class="editPupUp">
                <label for="edit-milliseconds">Milliseconds</label>
                <input type="number" id="edit-milliseconds" value="${Math.floor((currentTimestamp % 1) * 100)}" min="0" max="99">
            </div>

            <div class="popup-buttons">
                <button onclick="applyChanges(${index})" style="background-color: #64ff64;">Apply</button>
                <button onclick="hidePopup()">Cancel</button>
                <button onclick="confirmDelete(${index})" style="background-color: #ff6262;">Delete</button>
            </div>
        </div>
    `;
}

function applyChanges(index) {
    let newText = document.getElementById("edit-text").value;
    let newMinutes = parseInt(document.getElementById("edit-minutes").value);
    let newSeconds = parseInt(document.getElementById("edit-seconds").value);
    let newMilliseconds = parseInt(document.getElementById("edit-milliseconds").value) / 100;

    let newTimestamp = (newMinutes * 60) + newSeconds + newMilliseconds;

    let confirmChange = confirm("Are you sure you want to apply changes?");
    if (confirmChange) {
        lyrics[index].text = newText;
        lyrics[index].timestamp = newTimestamp;
        updateLyricsDisplay();
    }
    
    hidePopup();
}

function confirmDelete(index) {
    if (confirm("Are you sure you want to delete this line?")) {
        lyrics.splice(index, 1);
        updateLyricsDisplay();
    }
    hidePopup();
}

function hidePopup() {
    let popup = document.getElementById('popup');
    popup.classList.add("hide");
    popup.innerHTML = "";
}



// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

function setTimestamp(index) {
    let time = audio.currentTime;
    lyrics[index].timestamp = time;
    document.getElementById(`time-${index}`).innerText = formatTime(time);
}

function playFrom(index) {
    if (lyrics[index].timestamp !== null) {
        audio.currentTime = lyrics[index].timestamp;
        audio.play();
    }
}

// تعديل التوقيت بالزيادة أو النقصان
function adjustTime(index, amount, unit) {
    if (lyrics[index].timestamp !== null) {
        if (unit === 'min') lyrics[index].timestamp += amount * 60;
        if (unit === 'sec') lyrics[index].timestamp += amount;
        if (unit === 'ms') lyrics[index].timestamp += amount * 0.1;

        if (lyrics[index].timestamp < 0) lyrics[index].timestamp = 0;

        document.getElementById(`time-${index}`).innerText = formatTime(lyrics[index].timestamp);
    }
}

function confirmEdit(index) {
    let updatedText = document.getElementById(`lyric-text-${index}`).value;
    if (updatedText !== lyrics[index].text) {
        let confirmChange = confirm("The sentence will be editor in the original text. Confirm?");
        if (confirmChange) {
            lyrics[index].text = updatedText;
            updateTextarea();
        } else {
            document.getElementById(`lyric-text-${index}`).value = lyrics[index].text;
        }
    }
}

function deleteLyric(index) {
    if (confirm("Are you sure you want to delete this line?")) {
        lyrics.splice(index, 1);
        updateLyricsDisplay();
    }
}

function updateTextarea() {
    let textarea = document.getElementById('lyricsInput');
    textarea.value = lyrics.map(line => line.text).join('\n');
}

function formatTime(seconds) {
    let min = Math.floor(seconds / 60).toString().padStart(2, '0');
    let sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    let ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `[${min}:${sec}.${ms}]`;
}

function generateLRC() {
    let lrcContent = lyrics.map((line, index) => {
        let updatedText = document.getElementById(`lyric-text-${index}`).value;
        return line.timestamp !== null ? `${formatTime(line.timestamp)}${updatedText}` : '';
    }).join('\n');

    let blob = new Blob([lrcContent], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileInput.files[0].name.replace(".mp3", "") + ".lrc";
    link.click();
}


// ------------------------------


const fileInput = document.getElementById("audioFile");
const customButton = document.getElementById("customButton");
const fileInfo = document.getElementById("fileInfo");
const fileNameDisplay = document.getElementById("fileName");
const updateButton = document.getElementById("updateButton");

// When the user selects a file
fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
        customButton.style.display = "none"; // Hide select button
        fileInfo.style.display = "block"; // Show file info
    }
});

// When clicking "Update File"
updateButton.addEventListener("click", function () {
    fileInput.click(); // Trigger file input
});


//---------------------------------------------------


let textinput = document.getElementById("lyricsInput")
let synchs = document.getElementById("lyricsContainer")

function showSynch() {
    textinput.classList.add("hide")
    synchs.classList.remove("hide")
    synchs.classList.add("showLyricsContainer")
    loadLyrics()

}

function showText() {
    synchs.classList.add("hide")
    textinput.classList.remove("hide")
}




// Handling Keyboard
document.addEventListener("keydown", function(event) {
    // لو التركيز على textarea، لا تنفذ أي دالة
    if ((document.activeElement.tagName.toLowerCase() === "textarea") || (document.activeElement.tagName.toLowerCase() === "input")) {
        return;
    }

    if (event.key === " ") { // المسطرة
        event.preventDefault(); // منع التمرير لو فيه Scroll
        callSpaceFunction();
    } else if (event.key === "ArrowRight") { // السهم اليمين
        callRightArrowFunction();
    } else if (event.key === "ArrowLeft") { // السهم الشمال
        callLeftArrowFunction();
    }
});

function callSpaceFunction() {
    if (fileInput.files.length > 0) {
        audio.paused ? audio.play() : audio.pause();
    }
}





function callRightArrowFunction() {
    skip(3);
}

function callLeftArrowFunction() {
    skip(-3);
}


// استدعاء الدالة عند تحميل الصفحة
initTextareaListener();



    










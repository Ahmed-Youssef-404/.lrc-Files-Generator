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
    if (lastFile) { // بدل ما نعتمد على fileInput.files
        if (audio.paused) {
            audio.play();
            btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            audio.pause();
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    } else {
        alert("Please select an audio file first");
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
        div.setAttribute('data-timestamp', lyric.timestamp || 0);
        div.classList.add('lyric-line');
        div.innerHTML = `
            <input type="text" value="${lyric.text}" id="lyric-text-${index}" class="lyric-input" onblur="confirmEdit(${index})" dir="auto">
            <div class="lyricControls">
                <button onclick="setTimestamp(${index})" title="Sync with audio"><i class="fa-solid fa-clock"></i></button>
                <button onclick="playFrom(${index})" title="Play from here"><i class="fa-solid fa-play"></i></button>
                <span id="time-${index}" onclick="manualEditTime(${index})">
                    ${lyric.timestamp ? formatTime(lyric.timestamp).replace(/\[|\]/g, "") : "00:00.00"}
                </span>
                <button onclick="showPupUp(${index})"><i class="fa-solid fa-pencil" title="Edit"></i></button>
            </div>       
            
        `;
        container.appendChild(div);
    });
    updateTextarea();
}

// --------------------------------------

function highlightLyrics() {
    let currentTime = audio.currentTime;
    let lyricsContainer = document.getElementById('lyricsContainer');
    let parentContainer = document.querySelector('.showLyricsContainer'); // Restrict scrolling to this div
    let lines = lyricsContainer.getElementsByClassName('lyric-line');

    let activeLine = null;
    for (let line of lines) {
        let timestamp = parseFloat(line.getAttribute('data-timestamp'));
        if (!isNaN(timestamp) && currentTime >= timestamp) {
            activeLine = line;
        }
    }

    for (let line of lines) {
        line.classList.remove('highlight');
    }

    if (activeLine) {
        activeLine.classList.add('highlight');

        // Ensure "showLyricsContainer" scrolls properly
        if (parentContainer) {
            let containerTop = parentContainer.scrollTop; // Current scroll position
            let containerHeight = parentContainer.clientHeight; // Visible height
            let lineTop = activeLine.offsetTop - parentContainer.offsetTop; // Position of the lyric relative to the container
            let lineHeight = activeLine.clientHeight; // Height of the lyric

            let scrollPosition = lineTop - (containerHeight / 2) + (lineHeight / 2);
            parentContainer.scrollTo({
                top: scrollPosition,
                behavior: "smooth"
            });
        }
    }
}

audio.ontimeupdate = highlightLyrics;







function showPupUp(index) {
    // let overLay = document.getElementById(overLay);
    // overLay.classList.add("show");
    // overLay.classList.remove("hide");

    let popup = document.getElementById('popup');
    let currentText = lyrics[index].text;
    let currentTimestamp = lyrics[index].timestamp || 0;

    popup.classList.add("popup");
    popup.classList.remove("hide");

    popup.innerHTML = `
        <div class="popup-content">
            <div class="editPupUp">
                <label for="edit-text">Edit Text:</label>
                <input type="text" id="edit-text" value="${currentText}" dir="auto">
            </div>


            <div class="editPupUp">
                <label for="edit-minutes">Minutes</label>
                <input type="number" id="edit-minutes" value="${Math.floor(currentTimestamp / 60)}" min="0">
            </div>

            <div class="editPupUp">
                <label for="edit-seconds">Seconds</label>
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

    let overLay = document.getElementById("overLay");
    overLay.classList.add("show");
    overLay.classList.remove("hide");
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
    closeOverLay();
}



// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

function setTimestamp(index) {
    let time = audio.currentTime;
    lyrics[index].timestamp = time;
    // lyrics[index].timestamp = time;
    document.getElementById(`time-${index}`).innerText = formatTime(time).replace("[", "").replace("]", "");
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

// 

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

// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------



const lyricsInput = document.getElementById("lyricsInput");
const formattedText = document.querySelector(".formatted-text");

lyricsInput.addEventListener("input", () => {
    updateFormattedText();
});

lyricsInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        insertNewLine();
    }
});

function insertNewLine() {
    let cursorPos = lyricsInput.selectionStart;
    let textBefore = lyricsInput.value.substring(0, cursorPos);
    let textAfter = lyricsInput.value.substring(cursorPos);

    lyricsInput.value = textBefore + "\n" + textAfter;
    lyricsInput.selectionStart = lyricsInput.selectionEnd = cursorPos + 1;

    updateFormattedText();
}

function updateFormattedText() {
    let text = lyricsInput.value;
    let lines = text.split("\n");
    formattedText.innerHTML = "";

    lines.forEach((line, index) => {
        let p = document.createElement("p");
        p.textContent = line;

        // لو السطر ده تم إضافته بـ Enter يدويًا، نزود المسافة
        if (index > 0 && lines[index - 1] !== "") {
            p.classList.add("entered");
        }

        formattedText.appendChild(p);
    });
}




// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------


function formatTime(seconds) {
    let min = Math.floor(seconds / 60).toString().padStart(2, '0');
    let sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    let ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `[${min}:${sec}.${ms}]`;
}

function generateLRC() {
    if (!lastFile) { // بدل ما نعتمد على fileInput.files
        alert("Please select an audio file");
        return;
    }

    let lrcContent = lyrics.map((line, index) => {
        let updatedText = document.getElementById(`lyric-text-${index}`).value;
        return line.timestamp !== null ? `${formatTime(line.timestamp)}${updatedText}` : '';
    }).join('\n');

    let blob = new Blob([lrcContent], { type: 'text/plain' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = lastFile.name.replace(".mp3", "") + ".lrc"; // بدل fileInput.files
    link.click();
}


// ------------------------------


const fileInput = document.getElementById("audioFile");
const customButton = document.getElementById("customButton");
const fileInfo = document.getElementById("fileInfo");
const fileNameDisplay = document.getElementById("fileName");
const updateButton = document.getElementById("updateButton");

let lastFile = null; // متغير لحفظ آخر ملف مختار

fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        lastFile = fileInput.files[0]; // حفظ الملف الجديد
        fileNameDisplay.textContent = lastFile.name;
        customButton.style.display = "none"; // إخفاء زر الاختيار
        fileInfo.style.display = "block"; // عرض معلومات الملف
        audio.src = URL.createObjectURL(lastFile); // تحديث مصدر الصوت
    } else if (lastFile) {
        // لو المستخدم عمل Cancel، نرجع لآخر ملف محفوظ
        fileInput.value = ""; // منع تنفيذ الحدث بدون تغيير
    }
});


// When clicking "Update File"
updateButton.addEventListener("click", function () {
    fileInput.click(); // Trigger file input
});


//---------------------------------------------------


let textinput = document.getElementById("lyricsInput")
let synchs = document.getElementById("lyricsContainer")

// لما المستخدم يحاول عرض الـ Sync أو Text
function showSynch() {
    if (!lastFile) { // بدل ما نعتمد على fileInput.files، هنستخدم lastFile
        alert("Please select an audio file");
        return;
    }

    textinput.classList.add("hide");
    synchs.classList.remove("hide");
    synchs.classList.add("showLyricsContainer");

    loadLyrics();
}

function showText() {
    if (!lastFile) {
        alert("Please select an audio file");
        return;
    }
    synchs.classList.add("hide");
    textinput.classList.remove("hide");
}

function closeOverLay() {
    let overLay = document.getElementById("overLay");
    overLay.classList.add("hide");
    overLay.classList.remove("show");
}


// Handling Keyboard
document.addEventListener("keydown", function (event) {
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


// const player = new Plyr('#audio', {
//     controls: ['progress', 'current-time', 'mute', 'volume'],
//     autoplay: false
// });



// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------


const lrcFileInput = document.getElementById("lrcFile");
const lrcButton = document.getElementById("lrcButton");
const lrcFileInfo = document.getElementById("lrcFileInfo");

// Enable LRC input after MP3 selection
fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        lrcButton.style.display = "inline-block";
        lrcFileInput.disabled = false;
    } else {
        lrcButton.style.display = "none";
        lrcFileInput.disabled = true;
        lrcFileInfo.style.display = "none"; // Hide LRC file info if MP3 is removed
    }
});

// Handle LRC file replacement
const updateLrcButton = document.getElementById("updateLrcButton");
updateLrcButton.addEventListener("click", function () {
    lrcFileInput.click();
});

// Read LRC file content
lrcFileInput.addEventListener("change", function (event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let content = e.target.result;
            displayLRC(content);
        };
        reader.readAsText(file);

        // Show the file name and "Change File" button
        document.getElementById("lrcFileName").textContent = file.name;
        lrcFileInfo.style.display = "block";
    }
});

// Display LRC lyrics in the "synch" section
function displayLRC(lrcText) {
    lrcButton.style.display = "none";
    let lines = lrcText.split("\n").filter(line => line.trim() !== "");
    lyrics = lines.map(line => {
        let match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
            let minutes = parseInt(match[1]);
            let seconds = parseFloat(match[2]);
            return { text: match[3].trim(), timestamp: minutes * 60 + seconds };
        }
        return { text: line.trim(), timestamp: null };
    });

    updateLyricsDisplay();
    showSynch(); // Show synch section
}
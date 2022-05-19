let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')
let colorInput = document.getElementById('color')
let lineWidthInput = document.getElementById('line-width')
let playButton = document.getElementById('play')
let loopCheckbox = document.getElementById('loop')
let fpsInput = document.getElementById('fps')
let frameContainer = document.getElementById('frame-container')
let importImageButton = document.querySelector('.import.image')
let importVideoButton = document.querySelector('.import.video')
let exportButton = document.getElementById('export')
let outputLink = document.getElementById('output')
let drawingTool = 'pen'
let isPainting = false
let isPlaying = false
let frames = ['']
let fps = 10
let currentFrameNumber = 0
let playInterval
let importVideoInterval

clearFrame()
updateFrame()
changeFrame(0)

canvas.onmousedown = (event) => {
    isPainting = true
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

window.onmouseup = () => {
    isPainting = false
    saveFrame()
    ctx.beginPath();
}

canvas.onmousemove = (event) => {
    if (!isPainting || isPlaying) {
        return;
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidthInput.value
    if (drawingTool == 'pen')
        ctx.strokeStyle = colorInput.value
    else if (drawingTool == 'eraser')
        ctx.strokeStyle = 'white'
    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
}

document.onpaste = (event) => {
    let item = event.clipboardData.items[0]
    if (item.type.substring(0, 5) == 'image') {
        let blob = item.getAsFile();
        let reader = new FileReader();
        reader.onload = () => {
            let image = new Image()
            image.src = reader.result
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            }
        };
        reader.readAsDataURL(blob);
    }
}

fpsInput.onchange = () => {
    if (fpsInput.value > 90) fpsInput.value = 90
    else if (fpsInput.value < 1) fpsInput.value = 1
    fps = fpsInput.value
}

playButton.onclick = () => {
    if (playButton.innerText == 'Play') {
        isPlaying = true
        playButton.innerText = 'Stop'
        playInterval = setInterval(() => {
            if (currentFrameNumber + 1 == frames.length) {
                if (loopCheckbox.checked) {
                    changeFrame(0)
                }
                else {
                    isPlaying = false
                    clearInterval(playInterval)
                    playButton.innerText = 'Play'
                }
            } else {
                changeFrame(currentFrameNumber + 1)
            }
        }, 1000 / fps)
    } else if (playButton.innerText == 'Stop') {
        isPlaying = false
        clearInterval(playInterval)
        playButton.innerText = 'Play'
    }
}

function clearFrame() {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function addFrame() {
    frames.push('')
    changeFrame(frames.length - 1)
    frameContainer.scrollLeft = frameContainer.scrollWidth;
}

function duplicateFrame() {
    frames.push(canvas.toDataURL('image/webp'))
    changeFrame(frames.length - 1)
    frameContainer.scrollLeft = frameContainer.scrollWidth;
}

function deleteFrame() {
    if (frames.length == 1) clearFrame()
    else {
        frames.splice(currentFrameNumber, 1)
        changeFrame(currentFrameNumber - 1)
    }
}

function changeFrame(frameNumber) {
    if (frameNumber > frames.length - 1) frameNumber = frames.length - 1
    else if (frameNumber < 0) frameNumber = 0
    currentFrameNumber = frameNumber
    let frame = frames[currentFrameNumber]
    if (frame) {
        let image = new Image()
        image.src = frame
        image.onload = () => {
            clearFrame()
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        }
    } else clearFrame()
    updateFrame()
}

function updateFrame() {
    frameContainer.innerHTML = ''
    frames.map((frame, index) => {
        let liElement = document.createElement('li')
        liElement.onclick = () => {
            changeFrame(index)
        }
        liElement.innerText = index + 1
        frameContainer.appendChild(liElement)
    })
    frameContainer.children[currentFrameNumber].className = 'active'
}

function saveFrame() {
    frames[currentFrameNumber] = canvas.toDataURL('image/webp')
}

function getImageURL(imgData) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL(); //image URL
}

exportButton.onclick = () => {
    outputLink.innerText = ''
    let encoder = new Whammy.Video(fps);
    frames.map(frame => encoder.add(frame))
    encoder.compile(false, function (output) {
        let url = URL.createObjectURL(output);
        console.log(output)
        console.log(url)
        outputLink.href = url
        outputLink.innerText = 'Video link'
    })
}

importImageButton.onclick = () => {
    askForFile((file) => {
        let reader = new FileReader()
        reader.onload = () => {
            let image = new Image()
            image.src = reader.result
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            }
        }
        reader.readAsDataURL(file)
    }, 'image/*')
}

importVideoButton.onclick = () => {
    if (importVideoButton.innerText == 'Import video') {
        askForFile((file) => {
            let reader = new FileReader()
            reader.onload = () => {
                isPainting = false
                let video = document.createElement('video')
                let buffer = reader.result;
                let videoBlob = new Blob([new Uint8Array(buffer)], { type: 'video/mp4' });
                let url = window.URL.createObjectURL(videoBlob);
                video.src = url;
                video.play()
                video.onplay = () => {
                    console.log(video);
                    importVideoButton.innerText = 'Cancel'
                    let n = 0
                    importVideoInterval = setInterval(() => {
                        n++
                        if (n > Math.ceil(video.duration * 1000 * (fps / 1000)))
                            clearInterval(importVideoInterval)
                        else {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                            saveFrame()
                            addFrame()
                        }
                    }, 1000 / fps)
                }
            }
            reader.readAsArrayBuffer(file)
        }, 'video/*')
    } else if (importVideoButton.innerText == 'Cancel') {
        clearInterval(importVideoInterval)
        importVideoButton.innerText = 'Import video'
    }
}

function askForFile(callback, fileLimit) {
    let input = document.createElement('input')
    input.type = 'file'
    input.accept = fileLimit || ''
    input.click()
    input.onchange = () => {
        callback(input.files[0]);
    }
}
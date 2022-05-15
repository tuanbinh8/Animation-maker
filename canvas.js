let canvas = document.getElementById('canvas')
let ctx = canvas.getContext('2d')
let colorInput = document.getElementById('color')
let lineWidthInput = document.getElementById('line-width')
let playButton = document.getElementById('play')
let loopCheckbox = document.getElementById('loop')
let addFrameButton = document.getElementById('add-frame')
let fpsInput = document.getElementById('fps')
let frameContainer = document.getElementById('frame-container')
let exportButton = document.getElementById('export')
let outputLink = document.getElementById('output')
let drawingTool = 'pen'
let isPainting = false
let isPlaying = false
let frames = ['']
let fps = 10
let currentFrameNumber = 0
let playInterval

ctx.fillStyle = 'white'
ctx.fillRect(0, 0, canvas.width, canvas.height)
updateFrame()
changeFrame(0)

canvas.onmousedown = (event) => {
    isPainting = true
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

window.onmouseup = () => {
    isPainting = false
    frames[currentFrameNumber] = canvas.toDataURL('image/webp')
    ctx.beginPath();
    // console.log(frames);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

addFrameButton.onclick = () => {
    addFrame()
    clearFrame()
}

function addFrame() {
    frames.push('')
    changeFrame(frames.length - 1)
}

function duplicateFrame() {
    frames.push(canvas.toDataURL('image/webp'))
    changeFrame(frames.length - 1)
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
    let image = new Image()
    image.src = frame
    image.onload = () => {
        clearFrame()
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    }
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

exportButton.onclick = () => {
    outputLink.innerText = ''
    var encoder = new Whammy.Video(fps);
    frames.map(frame => encoder.add(frame))
    let output = encoder.compile()
    let url = URL.createObjectURL(output);
    console.log(output)
    console.log(url)
    outputLink.href = url
    outputLink.innerText = 'Video link'
}
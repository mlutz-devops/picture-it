import { symbols, colors } from "./symbols.js";
const socket = io.connect("localhost:8080");
const gridSize = 64;
let date;
let night = false;
let mode = "pen";
let mouseDown = false;
let currColor = "#000000";
let currHour = "0";
let currMin = "0";
let showData = false;
const apiKey = "27447ca21d92d7fec85b3deadb996969";
let timeInterval;
let swapInterval;
let dw = true;

const colorPicker = document.querySelector("#color-picker");
const btns = document.querySelectorAll(".button");
const clear = document.querySelector("#clear");
const penBtn = document.querySelector("#pen");
const eraser = document.querySelector("#eraser");
const dateWeather = document.querySelector("#dw");
const grid = document.getElementById("grid");

dateWeather.addEventListener("click", (e) => {
  showData = !showData;
  if (showData) {
    resetGrid();
    swapInterval = setInterval(() => {
      resetGrid();
      dw = !dw;
    }, 10000);
    timeInterval = setInterval(drawDateAndWeather, 1000);
  } else {
    clearInterval(timeInterval);
    clearInterval(swapInterval);
    resetGrid();
  }
});
clear.addEventListener("click", resetGrid);
eraser.addEventListener("click", () => {
  mode = "eraser";
});
penBtn.addEventListener("click", () => {
  mode = "pen";
});
document.body.onmousedown = () => {
  mouseDown = true;
};
document.body.onmouseup = () => {
  updateGrid();
  mouseDown = false;
};
document.body.ontouchstart = () => {
  mouseDown = true;
};
document.body.ontouchend = () => {
  updateGrid();
  mouseDown = false;
};
colorPicker.oninput = (e) => {
  currColor = e.target.value;
  document.querySelector("#pen path").style.color = e.target.value;
};
socket.on("sendGrid", (data) => {
  drawGridFromServer(data);
});

function getGrid() {
  const arr = [];
  for (let i = 0; i < 32; i++) {
    const row = [];
    for (let j = 0; j < 64; j++) {
      const sq = grid.children[j].children[i];
      const styles = window.getComputedStyle(sq);

      const red = parseInt(
        styles.getPropertyValue("background-color").split(",")[0].split("(")[1],
      );
      const green = parseInt(
        styles.getPropertyValue("background-color").split(",")[1],
      );
      const blue = parseInt(
        styles.getPropertyValue("background-color").split(",")[2].split(")")[0],
      );

      row.push([red, green, blue]);
    }
    arr.push(row);
  }
  return arr;
}
function updateGrid() {
  const arr = getGrid();
  socket.emit("color", arr);
}
function drawGridFromServer(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[0].length; j++) {
      let colors = arr[i][j];

      grid.children[j].children[
        i
      ].style.backgroundColor = `rgb(${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
  }
}
function start() {
  generateGrid(gridSize);
  getGrid();
}
function drawDateAndWeather() {
  if (dw) {
    drawDate();
  } else {
    getWeather("newark");
  }
}
function drawFrame(arr, x, y) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[0].length; j++) {
      let colors = arr[i][j];

      grid.children[j + x].children[
        i + y
      ].style.backgroundColor = `rgb(${colors[0]}, ${colors[1]}, ${colors[2]})`;
    }
  }
}
function drawGif(arr, x, y) {}

function resetGrid() {
  grid.innerHTML = "";
  generateGrid(gridSize);
  updateGrid();
}

function generateGrid(size) {
  for (let i = 0; i < size; i++) {
    const gridRow = document.createElement("div");
    gridRow.className = "row";
    for (let j = 0; j < size / 2; j++) {
      const tile = document.createElement("div");
      tile.className = "square";
      tile.addEventListener("mousedown", changeColor);
      tile.addEventListener("mouseover", changeColor);
      // tile.addEventListener("touchstart", changeColor);
      // tile.addEventListener("touchmove", changeColor);

      gridRow.appendChild(tile);
    }
    const grid = document.getElementById("grid");
    grid.appendChild(gridRow);
  }
}

function changeColor(e) {
  e.preventDefault();
  if (mouseDown || e.type === "mousedown") {
    if (mode === "eraser") {
      e.target.style.cssText = "";
    } else if (mode === "pen") {
      e.target.style.cssText = `background-color:${currColor}`;
    }
  }
}

const weatherColors = ["#c4c4c4", "#8195a6", "#faf323", "#fad726"];
window.onpageshow = () => {
  start();
  socket.emit("getGrid");
};

function drawSymbol(symbol, x, y, colors) {
  const sym = symbols[symbol];
  for (let i = 0; i < sym.length; i++) {
    for (let j = 0; j < sym[0].length; j++) {
      grid.children[j + x].children[i + y].style.backgroundColor =
        colors[sym[i][j] - 1];
    }
  }
}
function drawString(str, x, y, color) {
  for (let i = 0; i < str.length; i++) {
    drawSymbol(str[i], x, y, [color]);
    x += getWidth(str[i]) + 1;
  }
}
function clearString(str, x, y) {
  for (let i = 0; i < str.length; i++) {
    clearSymbol(str[i], x, y);
    x += getWidth(str[i]) + 1;
  }
}
function clearSymbol(symbol, x, y) {
  const sym = symbols[symbol];
  for (let i = 0; i < sym.length; i++) {
    for (let j = 0; j < sym[0].length; j++) {
      grid.children[j + x].children[i + y].style.backgroundColor = "#f1f1f1";
    }
  }
}
function centerY(symbol) {
  const height = getHeight(symbol);
  const mid = Math.floor((32 - height) / 2);
  return mid;
}
function centerX(symbol) {
  const width = getWidth(symbol);
  const mid = Math.floor((64 - width) / 2);
  return mid;
}
function centerStringX(str) {
  const width = getWidthString(str);
  const mid = Math.floor((64 - width) / 2);
  return mid;
}

function getHeight(key) {
  const sym = symbols[key];
  return sym.length;
}
function getWidth(key) {
  const sym = symbols[key];
  return sym[0].length;
}
function getWidthString(str) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    w += getWidth(str[i]) + 1;
  }
  return w;
}
async function getWeather(city) {
  const data = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`,
  );
  const weather = await data.json();
  let temp = Math.floor(weather.main.temp);
  let forcastId = weather.weather[0].id;
  let forcast;
  if (forcastId >= 200 && forcastId < 600) {
    forcast = "raincloud";
  } else if (forcastId >= 600 && forcastId < 700) {
    forcast = "snowcloud";
  } else if (forcastId === 800) {
    forcast = "sun";
  } else {
    forcast = "cloud";
  }
  drawSymbol(forcast, 10, centerY(forcast) - 1, weatherColors);
  drawString(temp + "*", gridSize / 2 + 1, centerY("1"), "black");
  updateGrid();
}

function drawDate() {
  if (showData) {
    // resetGrid();
    getTime();
    let day = date.toLocaleString("en-US", { weekday: "short" });
    let month = date.toLocaleString("en-US", { month: "short" });
    let monthNum = date.getMonth();
    let season;
    if (night) {
      season = "moon";
    } else if (monthNum === 0 || monthNum === 1 || monthNum === 11) {
      season = "snowman";
    } else if (monthNum === 2 || monthNum === 3 || monthNum === 4) {
      season = "flower";
    } else if (monthNum === 5 || monthNum === 6 || monthNum === 7) {
      season = "summer";
    } else {
      season = "leaf";
    }
    drawSymbol(season, centerX(season) - 17, centerY(season), colors[season]);
    drawString(day.toLowerCase(), centerX(1) + 9, centerY(1) - 10, "black");
    drawString(month.toLowerCase(), centerX(1) + 1, centerY(1), "black");
    drawString(date.getDate().toString(), centerX(1) + 21, centerY(1), "black");
    clearString(
      `${currHour}:${currMin}`,
      centerStringX(`${currHour}:${currMin}`) + 14,
      centerY(1) + 10,
    );
    drawString(
      `${currHour}:${currMin}`,
      centerStringX(`${currHour}:${currMin}`) + 14,
      centerY(1) + 10,
      "black",
    );
  }
  updateGrid();
}
function getTime() {
  date = new Date();
  currHour = date.getHours();
  currMin = date.getMinutes();
  if (currHour > 20 || currHour < 7) {
    night = true;
  } else {
    night = false;
  }
  currHour = currHour > 12 ? currHour - 12 : currHour === 0 ? 12 : currHour;
  if (currMin < 10) {
    currMin = "0" + currMin.toString();
  }
  currHour = currHour.toString();
  currMin = currMin.toString();
}

function gifToPixelArray(gifData) {
  var gifReader = new GifReader(new Uint8Array(gifData));

  var width = gifReader.width;
  var height = gifReader.height;
  var pixelArrays = [];

  for (var i = 0; i < gifReader.numFrames(); i++) {
    var frameData = gifReader.frameInfo(i);
    console.log(frameData);
    var framePixels = new Uint8Array(gifReader.width * gifReader.height * 4); // Update: Multiply by 4 for RGBA data
    gifReader.decodeAndBlitFrameRGBA(i, framePixels);

    var pixelArray = [];

    for (var y = 0; y < height; y++) {
      var row = [];
      for (var x = 0; x < width; x++) {
        var index = y * width + x;
        var pixelOffset = index * 4;
        var r = framePixels[pixelOffset];
        var g = framePixels[pixelOffset + 1];
        var b = framePixels[pixelOffset + 2];
        var a = framePixels[pixelOffset + 3];
        row.push([r, g, b, a]);
      }
      pixelArray.push(row);
    }

    pixelArrays.push(pixelArray);
  }

  return pixelArrays;
}
function loadGif(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";

  xhr.onload = function () {
    if (xhr.status === 200) {
      callback(xhr.response);
    } else {
      console.error("Failed to load GIF file:", xhr.statusText);
    }
  };

  xhr.send();
}

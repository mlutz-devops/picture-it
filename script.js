import { digits, chars, symbols } from "./symbols.js";
const gridSize = 64;
const middleX = gridSize / 2;
const middleY = gridSize / 4;
let eraserActive = false;
let mouseDown = false;
let currColor = "#000000";
let currHour = "0";
let currMin = "0";
let isTime = false;
const apiKey = "27447ca21d92d7fec85b3deadb996969";

const colorPicker = document.querySelector("#color-picker");
const btns = document.querySelectorAll(".button");
const clear = document.querySelector("#clear");
const penBtn = document.querySelector("#pen");
const eraser = document.querySelector("#eraser");
const time = document.querySelector("#time");
const grid = document.getElementById("grid");
const weather = document.querySelector("#weather");

time.addEventListener("click", (e) => {
  e.target.classList.toggle("active-btn");
  isTime = !isTime;
  if (isTime) {
    drawTime();
  } else {
    clearString(`${currHour}:${currMin}`, middleX, middleY);
  }
});
clear.addEventListener("click", resetGrid);
eraser.addEventListener("click", () => {
  eraserActive = true;
});
penBtn.addEventListener("click", () => {
  eraserActive = false;
});
for (const btn of btns) {
  btn.addEventListener("click", toggleActive);
}
document.body.onmousedown = () => {
  mouseDown = true;
};
document.body.onmouseup = () => {
  mouseDown = false;
};
colorPicker.oninput = (e) => {
  currColor = e.target.value;
};
weather.addEventListener("click", () => {
  resetGrid();
  getData("newark");
});

function resetGrid() {
  grid.innerHTML = "";
  generateGrid(gridSize);
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

      gridRow.appendChild(tile);
    }
    const grid = document.getElementById("grid");
    grid.appendChild(gridRow);
  }
}

function toggleActive(e) {
  const btns = document.querySelectorAll(".button");
  if (e.target.id === "pen" || e.target.id === "eraser") {
    for (const btn of btns) {
      btn.className = "button";
    }
    e.target.classList.toggle("active-btn");
  }
}

function changeColor(e) {
  if (mouseDown || e.type === "mousedown") {
    if (eraserActive) {
      e.target.style.cssText = "";
    } else if (e.target.className === "square") {
      e.target.style.cssText = `background-color:${currColor}`;
    }
  }
}

function start() {
  generateGrid(gridSize);
}
const leafColors = ["#CC5200", "#F2A069"];
const moonColors = ["#32302F", "#BABABA", "#777787"];
const flowerColors = [
  "#FEAE35",
  "#FEE861",
  "#D77643",
  "#BE4B30",
  "#3E8948",
  "#265C42",
  "#F67622",
  "#3A4467",
  "#5A6988",
  "#8B9BB4",
];
const snowmanColors = [
  "#E0A43B",
  "#000000",
  "#5F5959",
  "#FA0A0B",
  "#B8B7B7",
  "#DEDEDE",
  "#A30A0A",
  "#CE0C0C",
  "#D39C40",
  "#E2A438",
];
window.onpageshow = () => {
  start();
  drawSymbol("snowman", 0, 0, snowmanColors);
};

function drawSymbol(symbol, x, y, ...color) {
  const sym = symbols[symbol];
  for (let i = 0; i < sym.length; i++) {
    for (let j = 0; j < sym[0].length; j++) {
      if (sym[i][j] == 1) {
        console.log(color[0][0]);
        grid.children[j + x].children[i + y].style.backgroundColor = color[0][0];
      } else if (sym[i][j] == 2) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][1]}`;
      } else if (sym[i][j] == 3) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][2]}`;
      } else if (sym[i][j] == 4) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][3]}`;
      } else if (sym[i][j] == 5) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][4]}`;
      } else if (sym[i][j] == 6) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][5]}`;
      } else if (sym[i][j] == 7) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][6]}`;
      } else if (sym[i][j] == 8) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][7]}`;
      } else if (sym[i][j] == 9) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][8]}`;
      } else if (sym[i][j] == 10) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color[0][9]}`;
      } else {
        grid.children[j + x].children[i + y].style.backgroundColor = "#f1f1f1";
      }
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

function getHeight(key) {
  const sym = symbols[key];
  return sym.length;
}
function getWidth(key) {
  const sym = symbols[key];
  return sym[0].length;
}
async function getData(city) {
  const data = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
  );
  const weather = await data.json();
  let tempKelvin = Math.floor(weather.main.temp);
  let temp = Math.floor(((tempKelvin - 273.15) * 9) / 5 + 32).toString();
  drawSymbol("sun", 10, 7, ["orange"]);
  drawString(temp + "*", gridSize / 2 + 1, gridSize / 4 - 3, "black");
}
function drawTime() {
  if (isTime) {
    getTime();
    drawString(`${currHour}:${currMin}`, middleX, middleY, "black");
  }
}
function getTime() {
  let date = new Date();
  currHour = date.getHours();
  currMin = date.getMinutes();
  if (currHour > 12) {
    currHour -= 12;
  }
  if (currMin < 10) {
    currMin = "0" + currMin.toString();
  }
  currHour = currHour.toString();
  currMin = currMin.toString();
}
setInterval(drawTime, 1000);

import { digits, chars } from "./symbols.js";
const gridSize = 64;
const middleX = gridSize / 2;
const middleY = gridSize / 4;
let eraserActive = false;
let mouseDown = false;
let currColor = "#000000";
let currHour = 0;
let currMin = 0;
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
    let x = middleX - 10;
    let y = middleY - 5;
    clearSpace(
      x,
      y,
      getWidthDigit(0) * (getNumDigits(currHour) + 2) +
        getWidthDigit(14) +
        getNumDigits(currHour),
      getHeightDigit(0)
    );
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

window.onpageshow = () => {
  start();
};

function drawLetter(num, x, y, color) {
  let char = chars[num];
  for (let i = 0; i < char.length; i++) {
    for (let j = 0; j < char[0].length; j++) {
      if (char[i][j] == 1) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color}`;
      } else {
        grid.children[j + x].children[i + y].style.backgroundColor = "#f1f1f1";
      }
    }
  }
}
function drawDigit(num, x, y, color) {
  let number = digits[num];
  for (let i = 0; i < number.length; i++) {
    for (let j = 0; j < number[0].length; j++) {
      if (number[i][j] == 1) {
        grid.children[j + x].children[i + y].style.backgroundColor = `${color}`;
      } else {
        grid.children[j + x].children[i + y].style.backgroundColor = "#f1f1f1";
      }
    }
  }
}
function clearSpace(x, y, width, height) {
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      grid.children[j + x].children[i + y].style.backgroundColor = "#f1f1f1";
    }
  }
}
function drawNumber(num, x, y) {
  let offset = 0;
  if (num < 0) {
    offset = 6;
    num = Math.abs(num);
    drawDigit(10, x, y, "black");
  }
  let numString = num.toString();
  for (let h = 0; h < numString.length; h += 1) {
    drawDigit(numString[h], x + offset, y, "black");
    offset += 6;
  }
}
function getNumDigits(num) {
  let tot = 0;
  while (num > 0) {
    num = Math.floor(num / 10);
    tot++;
  }
  return tot;
}
function drawTemp(num, x, y) {
  let offset = 0;
  if (num < 0) {
    offset = 6;
    num = Math.abs(num);
    drawDigit(10, x, y, "black");
  }
  let numString = num.toString();
  for (let h = 0; h < numString.length; h += 1) {
    drawDigit(numString[h], x + offset, y, "black");
    offset += 6;
  }
  drawDigit(11, x + offset, y, "black");
}

async function getData(city) {
  const data = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
  );
  const weather = await data.json();
  let tempKelvin = Math.floor(weather.main.temp);
  let temp = Math.floor(((tempKelvin - 273.15) * 9) / 5 + 32);
  drawDigit(13, 10, 7, "orange");
  drawTemp(temp, gridSize / 2 + 1, gridSize / 4 - 3, "black");
}
function getWidthDigit(num) {
  return digits[num][0].length;
}
function getWidthChar(num) {
  return chars[num][0].length;
}
function getHeightDigit(num) {
  return digits[num].length;
}
function getHeightChar(num) {
  return chars[num].length;
}
function drawTime() {
  if (isTime) {
    let date = new Date();
    let x = middleX - 10;
    let y = middleY - 5;
    currHour = date.getHours();
    currMin = date.getMinutes();
    clearSpace(
      x,
      y,
      getWidthDigit(0) * (getNumDigits(currHour) + 2) +
        getWidthDigit(14) +
        getNumDigits(currHour),
      getHeightDigit(0)
    );
    let offset;
    if (currHour > 12) {
      offset = getNumDigits(currHour) * getWidthDigit(0) + 1;
      currHour -= 12;
    } else if (currHour == 0) {
      currHour = 12;
    } else {
      offset = getNumDigits(currHour) * getWidthDigit(0);
    }
    drawNumber(currHour, x, y, "black");
    drawDigit(14, x + offset, y, "black");
    if (currMin < 10) {
      drawNumber(0, x + offset + 3, y, "black");
      drawNumber(currMin, x + offset + 9, y, "black");
    } else {
      drawNumber(currMin, x + offset + 3, y, "black");
    }
  }
}
setInterval(drawTime, 1000);

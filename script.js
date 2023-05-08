let gridSize = 64;
let eraserActive = false;
let mouseDown = false;
let currColor = "#000000";

const colorPicker = document.querySelector("#color-picker");
const btns = document.querySelectorAll(".button");
const clear = document.querySelector("#clear");
const penBtn = document.querySelector("#pen");
const eraser = document.querySelector("#eraser");
const filePicker = document.querySelector("#file-picker");
filePicker.oninput = (e) => {
  console.log(e.target.value);
};

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

function resetGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  generateGrid(gridSize);
}

function generateGrid(size) {
  for (i = 0; i < size; i++) {
    const gridRow = document.createElement("div");
    gridRow.className = "row";
    for (j = 0; j < size; j++) {
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
function renderNum() {}

function start() {
  generateGrid(gridSize);
}

window.onpageshow = () => {
  start();
};

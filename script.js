// Variabile globale
let svgEditor = document.getElementById("editor");
let currentTool = null; // Instrumentul curent: rectangle, ellipse, line
let currentColor = "#000000"; // Culoarea liniei
let currentLineWidth = 1; // Grosimea liniei
let isDrawing = false; // Stare: dacă utilizatorul desenează
let isDragging = false; // Stare: dacă utilizatorul mută un element
let startX = 0, startY = 0; // Coordonate de start
let currentShape = null; // Forma curentă desenată

// Setăm instrumentul curent la dreptunghi
document.getElementById("add-rectangle").addEventListener("click", () => {
    currentTool = "rectangle";
});

// Setăm instrumentul curent la elipsă
document.getElementById("add-ellipse").addEventListener("click", () => {
    currentTool = "ellipse";
});

// Setăm instrumentul curent la linie
document.getElementById("add-line").addEventListener("click", () => {
    currentTool = "line";
});

// Actualizează culoarea liniei
document.getElementById("line-color").addEventListener("change", (e) => {
    currentColor = e.target.value;
    if (selectedElement) {
        selectedElement.setAttribute("stroke", currentColor);
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

// Actualizează grosimea liniei
document.getElementById("line-width").addEventListener("change", (e) => {
    currentLineWidth = parseInt(e.target.value, 10) || 1;
    if (selectedElement) {
        selectedElement.setAttribute("stroke-width", currentLineWidth);
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

// Eveniment mouse-down pentru începerea desenului
svgEditor.addEventListener("mousedown", (e) => {
    if (!currentTool) return; // Dacă nu s-a selectat un instrument, ieșim

    isDrawing = true;
    const rect = svgEditor.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    // Creăm forma SVG în funcție de instrumentul curent
    if (currentTool === "rectangle") {
        currentShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        currentShape.setAttribute("x", startX);
        currentShape.setAttribute("y", startY);
        currentShape.setAttribute("width", 0);
        currentShape.setAttribute("height", 0);
        currentShape.setAttribute("stroke", currentColor);
        currentShape.setAttribute("stroke-width", currentLineWidth);
        currentShape.setAttribute("fill", "none");
    } else if (currentTool === "ellipse") {
        currentShape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        currentShape.setAttribute("cx", startX);
        currentShape.setAttribute("cy", startY);
        currentShape.setAttribute("rx", 0);
        currentShape.setAttribute("ry", 0);
        currentShape.setAttribute("stroke", currentColor);
        currentShape.setAttribute("stroke-width", currentLineWidth);
        currentShape.setAttribute("fill", "none");
    } else if (currentTool === "line") {
        currentShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
        currentShape.setAttribute("x1", startX);
        currentShape.setAttribute("y1", startY);
        currentShape.setAttribute("x2", startX);
        currentShape.setAttribute("y2", startY);
        currentShape.setAttribute("stroke", currentColor);
        currentShape.setAttribute("stroke-width", currentLineWidth);
    }

    // Adăugăm forma în editorul SVG
    svgEditor.appendChild(currentShape);
    pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
});

// Eveniment mouse-move pentru actualizarea formei
svgEditor.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentShape) return;

    const rect = svgEditor.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (currentTool === "rectangle") {
        currentShape.setAttribute("width", Math.abs(currentX - startX));
        currentShape.setAttribute("height", Math.abs(currentY - startY));
        currentShape.setAttribute("x", Math.min(startX, currentX));
        currentShape.setAttribute("y", Math.min(startY, currentY));
    } else if (currentTool === "ellipse") {
        currentShape.setAttribute("rx", Math.abs(currentX - startX) / 2);
        currentShape.setAttribute("ry", Math.abs(currentY - startY) / 2);
        currentShape.setAttribute("cx", (currentX + startX) / 2);
        currentShape.setAttribute("cy", (currentY + startY) / 2);
    } else if (currentTool === "line") {
        currentShape.setAttribute("x2", currentX);
        currentShape.setAttribute("y2", currentY);
    }
});

// Eveniment mouse-up pentru finalizarea desenului
svgEditor.addEventListener("mouseup", () => {
    isDrawing = false;
    currentShape = null; // Resetăm forma curentă
});

let selectedElement = null; // Elementul SVG selectat

// Funcție pentru selectarea unei forme existente
svgEditor.addEventListener("click", (e) => {
    if (e.target === svgEditor) {
        // Dacă dăm click pe spațiul gol, deselectăm elementul
        deselectElement();
        return;
    }

    // Selectăm elementul SVG doar dacă este formă validă
    if (["rect", "ellipse", "line"].includes(e.target.tagName)) {
        selectedElement = e.target;
        selectedElement.classList.add("selectat");

        // Actualizăm input-urile cu proprietățile elementului selectat
        document.getElementById("line-color").value = selectedElement.getAttribute("stroke") || "#000000";
        document.getElementById("line-width").value = selectedElement.getAttribute("stroke-width") || 1;
    }
});

// Funcție pentru deselectarea elementului
function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove("selectat");
        selectedElement = null;
    }
}

// Actualizarea proprietăților formei selectate
document.getElementById("line-color").addEventListener("input", (e) => {
    if (selectedElement) {
        selectedElement.setAttribute("stroke", e.target.value);
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

document.getElementById("line-width").addEventListener("input", (e) => {
    if (selectedElement) {
        selectedElement.setAttribute("stroke-width", parseInt(e.target.value, 10) || 1);
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

// Adăugăm culoarea de fundal (pentru dreptunghi și elipsă)
document.getElementById("background-color")?.addEventListener("input", (e) => {
    if (selectedElement && ["rect", "ellipse"].includes(selectedElement.tagName)) {
        selectedElement.setAttribute("fill", e.target.value);
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

// Ștergerea elementului selectat
document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" && selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        pushToUndoStack(); // Adăugăm acțiunea în stiva de undo
    }
});

//Undo si Redo la apasare ctrl + z si ctrl + y
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") {
        undo();
    } else if (e.ctrlKey && e.key === "y") {
        redo();
    }
});

let undoStack = []; // Stiva pentru undo
let redoStack = []; // Stiva pentru redo

// Funcție pentru adăugarea unei acțiuni în stiva de undo
function pushToUndoStack() {
    undoStack.push(svgEditor.innerHTML);
    redoStack = []; // Resetăm stiva de redo
}

// Funcție pentru undo
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(svgEditor.innerHTML);
        svgEditor.innerHTML = undoStack.pop();
    }
}

// Funcție pentru redo
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(svgEditor.innerHTML);
        svgEditor.innerHTML = redoStack.pop();
    }
}

let isCursorMode = false; // Variabilă pentru modul cursor

// Buton pentru activarea modului cursor
document.getElementById("cursor-mode").addEventListener("click", () => {
    isCursorMode = true; // Activăm modul cursor
    currentTool = null; // Dezactivăm orice instrument de desenare
    deselectElement(); // Deselectăm elementul
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active"));
    document.getElementById("cursor-mode").classList.add("active");
});

// Butoanele de desenare dezactivează modul cursor
document.querySelectorAll("#add-rectangle, #add-ellipse, #add-line").forEach(button => {
    button.addEventListener("click", () => {
        isCursorMode = false; // Dezactivăm modul cursor
        document.getElementById("cursor-mode").classList.remove("active");
    });
});

// Actualizare mousedown pentru mutare sau desenare
svgEditor.addEventListener("mousedown", (e) => {
    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isCursorMode && e.target.tagName !== "svg") {
        // Mutare element existent în modul cursor
        selectedElement = e.target;
        isDragging = true;

        if (selectedElement.tagName === "rect") {
            offsetX = mouseX - parseFloat(selectedElement.getAttribute("x"));
            offsetY = mouseY - parseFloat(selectedElement.getAttribute("y"));
        } else if (selectedElement.tagName === "ellipse") {
            offsetX = mouseX - parseFloat(selectedElement.getAttribute("cx"));
            offsetY = mouseY - parseFloat(selectedElement.getAttribute("cy"));
        } else if (selectedElement.tagName === "line") {
            offsetX = mouseX - parseFloat(selectedElement.getAttribute("x1"));
            offsetY = mouseY - parseFloat(selectedElement.getAttribute("y1"));
        }
    } else if (!isCursorMode && currentTool) {
        // Desenare formă nouă
        isDrawing = true;
        startX = mouseX;
        startY = mouseY;

        if (currentTool === "rectangle") {
            currentShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            currentShape.setAttribute("x", startX);
            currentShape.setAttribute("y", startY);
            currentShape.setAttribute("width", 0);
            currentShape.setAttribute("height", 0);
            currentShape.setAttribute("stroke", currentColor);
            currentShape.setAttribute("stroke-width", currentLineWidth);
            currentShape.setAttribute("fill", "none");
        } else if (currentTool === "ellipse") {
            currentShape = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            currentShape.setAttribute("cx", startX);
            currentShape.setAttribute("cy", startY);
            currentShape.setAttribute("rx", 0);
            currentShape.setAttribute("ry", 0);
            currentShape.setAttribute("stroke", currentColor);
            currentShape.setAttribute("stroke-width", currentLineWidth);
            currentShape.setAttribute("fill", "none");
        } else if (currentTool === "line") {
            currentShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
            currentShape.setAttribute("x1", startX);
            currentShape.setAttribute("y1", startY);
            currentShape.setAttribute("x2", startX);
            currentShape.setAttribute("y2", startY);
            currentShape.setAttribute("stroke", currentColor);
            currentShape.setAttribute("stroke-width", currentLineWidth);
        }

        svgEditor.appendChild(currentShape);
    }
});

svgEditor.addEventListener("mousemove", (e) => {
    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && selectedElement) {
        // Mutăm elementul
        if (selectedElement.tagName === "rect") {
            selectedElement.setAttribute("x", mouseX - offsetX);
            selectedElement.setAttribute("y", mouseY - offsetY);
        } else if (selectedElement.tagName === "ellipse") {
            selectedElement.setAttribute("cx", mouseX - offsetX);
            selectedElement.setAttribute("cy", mouseY - offsetY);
        } else if (selectedElement.tagName === "line") {
            const dx = mouseX - offsetX;
            const dy = mouseY - offsetY;
            selectedElement.setAttribute("x1", dx);
            selectedElement.setAttribute("y1", dy);
            selectedElement.setAttribute("x2", dx + (parseFloat(selectedElement.getAttribute("x2")) - parseFloat(selectedElement.getAttribute("x1"))));
            selectedElement.setAttribute("y2", dy + (parseFloat(selectedElement.getAttribute("y2")) - parseFloat(selectedElement.getAttribute("y1"))));
        }
        if (isDrawing && currentShape) {
            // Actualizăm forma desenată
            if (currentTool === "rectangle") {
                currentShape.setAttribute("width", Math.abs(mouseX - startX));
                currentShape.setAttribute("height", Math.abs(mouseY - startY));
                currentShape.setAttribute("x", Math.min(startX, mouseX));
                currentShape.setAttribute("y", Math.min(startY, mouseY));
            } else if (currentTool === "ellipse") {
                currentShape.setAttribute("rx", Math.abs(mouseX - startX) / 2);
                currentShape.setAttribute("ry", Math.abs(mouseY - startY) / 2);
                currentShape.setAttribute("cx", (mouseX + startX) / 2);
                currentShape.setAttribute("cy", (mouseY + startY) / 2);
            } else if (currentTool === "line") {
                currentShape.setAttribute("x2", mouseX);
                currentShape.setAttribute("y2", mouseY);
            }
        } else if (isCursorMode && e.target.tagName !== "svg") {
            // Selectăm elementul doar în modul cursor
            selectedElement = e.target;
            selectedElement.classList.add("selectat");

            // Actualizăm input-urile cu proprietățile elementului selectat
            document.getElementById("line-color").value = selectedElement.getAttribute("stroke") || "#000000";
            document.getElementById("line-width").value = selectedElement.getAttribute("stroke-width") || 1;

        }
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    isDrawing = false;
    currentShape = null;
    if (!isCursorMode) {
        selectedElement = null;
    }
    pushToUndoStack(); // Salvăm starea
});

// deselectam forma selectata la oprirea click stanga si cursorul selectat
document.addEventListener("click", (e) => {
    if (e.target.tagName === "svg" && isCursorMode) {
        deselectElement();
    }
});

let pathPoints = []; // Punctele caii
let pathElement = null; // Elementul caii
let isPathDrawing = false; // Starea desenării caii
let editPoints = []; // Elemente SVG pentru punctele de editare
let isEditingPoint = false; // Indică dacă mutăm un punct
let activePointIndex = null; // Indexul punctului activ

// Buton pentru desenarea căii
document.getElementById("add-path").addEventListener("click", () => {
    currentTool = "path";
    pathPoints = [];
    pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("stroke", currentColor);
    pathElement.setAttribute("stroke-width", currentLineWidth);
    pathElement.setAttribute("fill", "none");
    svgEditor.appendChild(pathElement);

    // Ștergem punctele de editare anterioare
    clearEditPoints();
});

// Eveniment mousedown pentru desenarea căii
svgEditor.addEventListener("mousedown", (e) => {
    if (currentTool !== "path" || isEditingPoint) return;

    isPathDrawing = true;
    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    pathPoints.push([mouseX, mouseY]);
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));

    // Adăugăm punct de editare (cerc)
    addEditPoint(mouseX, mouseY, pathPoints.length - 1);
});

// Eveniment mousemove pentru desenarea căii
svgEditor.addEventListener("mousemove", (e) => {
    if (!isPathDrawing) return;

    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    pathPoints.push([mouseX, mouseY]);
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));
});

// Eveniment mouseup pentru finalizarea desenului
svgEditor.addEventListener("mouseup", () => {
    if (isPathDrawing) {
        isPathDrawing = false;
        pushToUndoStack();
    }
});

// Funcție pentru generarea atributului "d" al căii
function getPathDAttribute(points) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i][0]} ${points[i][1]}`;
    }
    return d;
}

// Funcție pentru adăugarea unui punct de editare
function addEditPoint(x, y, index) {
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("cx", x);
    point.setAttribute("cy", y);
    point.setAttribute("r", 5);
    point.setAttribute("fill", "red");
    point.style.cursor = "pointer";

    // Eveniment pentru mutarea punctului
    point.addEventListener("mousedown", (e) => {
        isEditingPoint = true;
        activePointIndex = index;
        e.stopPropagation();
    });

    svgEditor.appendChild(point);
    editPoints.push(point);
}

// Eveniment mousemove pentru mutarea punctului de editare
svgEditor.addEventListener("mousemove", (e) => {
    if (!isEditingPoint || activePointIndex === null) return;

    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Actualizăm poziția punctului
    pathPoints[activePointIndex] = [mouseX, mouseY];
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));

    // Actualizăm poziția cercului
    editPoints[activePointIndex].setAttribute("cx", mouseX);
    editPoints[activePointIndex].setAttribute("cy", mouseY);
});

// Eveniment mouseup pentru oprirea mutării punctului
document.addEventListener("mouseup", () => {
    if (isEditingPoint) {
        isEditingPoint = false;
        activePointIndex = null;
        pushToUndoStack();
    }
});

// Funcție pentru ștergerea punctelor de editare
function clearEditPoints() {
    editPoints.forEach((point) => point.remove());
    editPoints = [];
}



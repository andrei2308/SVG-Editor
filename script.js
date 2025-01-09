// Variabile globale
let svgEditor = document.getElementById("editor");
let currentTool = null; // Instrumentul curent: rectangle, ellipse, line
let currentColor = "#000000"; // Culoarea liniei
let currentLineWidth = 1; // Grosimea liniei
let isDrawing = false; // Stare: daca utilizatorul deseneaza
let isDragging = false; // Stare: daca utilizatorul muta un element
let startX = 0, startY = 0; // Coordonate de start
let currentShape = null; // Forma curenta desenata

// Setam instrumentul curent la dreptunghi
document.getElementById("add-rectangle").addEventListener("click", () => {
    currentTool = "rectangle";
});

// Setam instrumentul curent la elipsa
document.getElementById("add-ellipse").addEventListener("click", () => {
    currentTool = "ellipse";
});

// Setam instrumentul curent la linie
document.getElementById("add-line").addEventListener("click", () => {
    currentTool = "line";
});

// Actualizeaza culoarea liniei
document.getElementById("line-color").addEventListener("change", (e) => {
    currentColor = e.target.value;
    if (selectedElement) {
        selectedElement.setAttribute("stroke", currentColor);
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
    }
});

// Actualizeaza grosimea liniei
document.getElementById("line-width").addEventListener("change", (e) => {
    currentLineWidth = parseInt(e.target.value, 10) || 1;
    if (selectedElement) {
        selectedElement.setAttribute("stroke-width", currentLineWidth);
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
    }
});

// Eveniment mouse-down pentru inceperea desenului
svgEditor.addEventListener("mousedown", (e) => {
    if (!currentTool) return; // Daca nu s-a selectat un instrument, iesim

    isDrawing = true;
    const rect = svgEditor.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    // Cream forma SVG in functie de instrumentul curent
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

    // Adaugam forma in editorul SVG
    svgEditor.appendChild(currentShape);
    pushToUndoStack(); // Adaugam actiunea in stiva de undo
});

// Eveniment mouse-move pentru actualizarea formei
svgEditor.addEventListener("mousemove", (e) => {
    if (!isDrawing || !currentShape) return;

    const rect = svgEditor.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Actualizam forma in functie de instrumentul curent
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
    currentShape = null; // Resetam forma curentă
});

let selectedElement = null; // Elementul SVG selectat

// Functie pentru selectarea unei forme existente
svgEditor.addEventListener("click", (e) => {
    if (e.target === svgEditor) {
        // Dacă dam click pe spatiul gol, deselectam elementul
        deselectElement();
        return;
    }

    // Selectam elementul SVG doar daca este forma valida
    if (["rect", "ellipse", "line"].includes(e.target.tagName)) {
        selectedElement = e.target;
        selectedElement.classList.add("selectat");

        // Actualizam input-urile cu proprietatile elementului selectat
        document.getElementById("line-color").value = selectedElement.getAttribute("stroke") || "#000000";
        document.getElementById("line-width").value = selectedElement.getAttribute("stroke-width") || 1;
    }
});

// Functie pentru deselectarea elementului
function deselectElement() {
    if (selectedElement) {
        selectedElement.classList.remove("selectat");
        selectedElement = null;
    }
}

// Actualizarea proprietatilor formei selectate
document.getElementById("line-color").addEventListener("input", (e) => {
    if (selectedElement) {
        selectedElement.setAttribute("stroke", e.target.value);
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
    }
});

document.getElementById("line-width").addEventListener("input", (e) => {
    if (selectedElement) {
        selectedElement.setAttribute("stroke-width", parseInt(e.target.value, 10) || 1);
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
    }
});

// Adaugam culoarea de fundal (pentru dreptunghi si elipsa)
document.getElementById("background-color")?.addEventListener("input", (e) => {
    if (selectedElement && ["rect", "ellipse"].includes(selectedElement.tagName)) {
        selectedElement.setAttribute("fill", e.target.value);
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
    }
});

// Stergerea elementului selectat
document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" && selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        pushToUndoStack(); // Adaugam actiunea in stiva de undo
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

// Functie pentru adaugarea unei actiuni in stiva de undo
function pushToUndoStack() {
    undoStack.push(svgEditor.innerHTML);
    redoStack = []; // Resetam stiva de redo
}

// Functie pentru undo
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(svgEditor.innerHTML);
        svgEditor.innerHTML = undoStack.pop();
    }
}

// Functie pentru redo
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(svgEditor.innerHTML);
        svgEditor.innerHTML = redoStack.pop();
    }
}

let isCursorMode = false; // Variabila pentru modul cursor

// Buton pentru activarea modului cursor
document.getElementById("cursor-mode").addEventListener("click", () => {
    isCursorMode = true; // Activam modul cursor
    currentTool = null; // Dezactivam orice instrument de desenare
    deselectElement(); // Deselectam elementul
    document.querySelectorAll(".toolbar button").forEach(btn => btn.classList.remove("active"));
    document.getElementById("cursor-mode").classList.add("active");
});

// Butoanele de desenare dezactiveaza modul cursor
document.querySelectorAll("#add-rectangle, #add-ellipse, #add-line").forEach(button => {
    button.addEventListener("click", () => {
        isCursorMode = false; // Dezactivam modul cursor
        document.getElementById("cursor-mode").classList.remove("active");
    });
});

// Actualizare mousedown pentru mutare sau desenare
svgEditor.addEventListener("mousedown", (e) => {
    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isCursorMode && e.target.tagName !== "svg") {
        // Mutare element existent in modul cursor
        selectedElement = e.target;
        isDragging = true;

        // Calculam offset-ul pentru a pastra pozitia cursorului
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
        // Desenare forma nouă
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
        // Mutam elementul
        // Verificam tipul elementului si actualizam coordonatele
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
            // Actualizam forma desenata
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
            // Selectam elementul doar in modul cursor
            selectedElement = e.target;
            selectedElement.classList.add("selectat");

            // Actualizam input-urile cu proprietatile elementului selectat
            document.getElementById("line-color").value = selectedElement.getAttribute("stroke") || "#000000";
            document.getElementById("line-width").value = selectedElement.getAttribute("stroke-width") || 1;

        }
    }
});


// Eveniment mouseup pentru oprirea desenului sau mutarii
document.addEventListener("mouseup", () => {
    isDragging = false;
    isDrawing = false;
    currentShape = null;
    if (!isCursorMode) {
        selectedElement = null;
    }
    pushToUndoStack(); // Salvam starea
});

// deselectam forma selectata la oprirea click stanga si cursorul selectat
document.addEventListener("click", (e) => {
    if (e.target.tagName === "svg" && isCursorMode) {
        deselectElement();
    }
});

let pathPoints = []; // Punctele caii
let pathElement = null; // Elementul caii
let isPathDrawing = false; // Starea desenarii caii
let editPoints = []; // Elemente SVG pentru punctele de editare
let isEditingPoint = false; // Indica dacă mutam un punct
let activePointIndex = null; // Indexul punctului activ

// Buton pentru desenarea caii
document.getElementById("add-path").addEventListener("click", () => {
    currentTool = "path";
    pathPoints = [];
    pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("stroke", currentColor);
    pathElement.setAttribute("stroke-width", currentLineWidth);
    pathElement.setAttribute("fill", "none");
    svgEditor.appendChild(pathElement);

    // Stergem punctele de editare anterioare
    clearEditPoints();
});

// Eveniment mousedown pentru desenarea caii
svgEditor.addEventListener("mousedown", (e) => {
    if (currentTool !== "path" || isEditingPoint) return;

    isPathDrawing = true;
    const rect = svgEditor.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    pathPoints.push([mouseX, mouseY]);
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));

    // Adaugam punct de editare (cerc)
    addEditPoint(mouseX, mouseY, pathPoints.length - 1);
});

// Eveniment mousemove pentru desenarea caii
svgEditor.addEventListener("mousemove", (e) => {
    if (!isPathDrawing) return;

    // rect reprezinta dimensiunile SVG-ului
    const rect = svgEditor.getBoundingClientRect();

    // mouseX si mouseY reprezinta coordonatele mouse-ului in SVG
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    pathPoints.push([mouseX, mouseY]);

    // pathElement.setAttribute actualizeaza atributul "d" al elementului path. Atributul "d" reprezinta calea SVG
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));
});

// Eveniment mouseup pentru finalizarea desenului
svgEditor.addEventListener("mouseup", () => {
    if (isPathDrawing) {
        isPathDrawing = false;
        pushToUndoStack();
    }
});

// Functie pentru generarea atributului "d" al caii
function getPathDAttribute(points) {

    // d reprezinta calea SVG
    let d = `M ${points[0][0]} ${points[0][1]}`;

    // Adaugam linii catre fiecare punct
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i][0]} ${points[i][1]}`;
    }

    // Returnam calea SVG
    return d;
}

// Functie pentru adaugarea unui punct de editare
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

    // Actualizam pozitia punctului
    pathPoints[activePointIndex] = [mouseX, mouseY];
    pathElement.setAttribute("d", getPathDAttribute(pathPoints));

    // Actualizam pozitia cercului
    editPoints[activePointIndex].setAttribute("cx", mouseX);
    editPoints[activePointIndex].setAttribute("cy", mouseY);
});

// Eveniment mouseup pentru oprirea mutarii punctului
document.addEventListener("mouseup", () => {
    if (isEditingPoint) {
        isEditingPoint = false;
        activePointIndex = null;
        pushToUndoStack();
    }
});

// Functie pentru stergerea punctelor de editare
function clearEditPoints() {
    editPoints.forEach((point) => point.remove());
    editPoints = [];
}

document.getElementById("export-raster").addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Obtine dimensiunile SVG-ului
    const svgRect = svgEditor.getBoundingClientRect();
    canvas.width = svgRect.width;
    canvas.height = svgRect.height;

    // Serializam SVG-ul
    const svgString = new XMLSerializer().serializeToString(svgEditor);
    const img = new Image();

    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Curatam canvasul
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Desenm SVG-ul pe canvas

        // Cream un link pentru descarcare
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "editor.png";
        a.click();
    };

    // Convertim SVG-ul intr-un URL imagine
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
});


document.getElementById("export-svg").addEventListener("click", () => {
    // Clonam SVG-ul pentru a adăuga atributele de dimensiune
    const svgClone = svgEditor.cloneNode(true);

    // Obtinem dimensiunile SVG-ului
    const svgRect = svgEditor.getBoundingClientRect();
    svgClone.setAttribute("width", svgRect.width);
    svgClone.setAttribute("height", svgRect.height);
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg"); // Adaugam namespace-ul dacă lipseste

    // Serializam SVG-ul
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Cream un link pentru descărcare
    const a = document.createElement("a");
    a.href = url;
    a.download = "editor.svg";
    a.click();
    URL.revokeObjectURL(url); // Curatam URL-ul generat
});

//Salvarea automata a desenului si reincarcarea acestuia la pornire cu ajutorul web storage api 
// Functie pentru salvarea desenului în localStorage
function saveToLocalStorage() {
    const svgString = new XMLSerializer().serializeToString(svgEditor);
    localStorage.setItem("savedSVG", svgString);
    console.log("Desen salvat în localStorage");
}

// Functie pentru incarcarea desenului din localStorage
function loadFromLocalStorage() {
    const savedSVG = localStorage.getItem("savedSVG");
    if (savedSVG) {
        svgEditor.innerHTML = savedSVG;

        // Adaugam namespace-ul dacă lipseste
        if (!svgEditor.hasAttribute("xmlns")) {
            svgEditor.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }

        console.log("Desen încărcat din localStorage");
    } else {
        console.log("Nu există un desen salvat.");
    }
}

// Salvarea automata inainte de inchiderea paginii
window.addEventListener("beforeunload", () => {
    saveToLocalStorage();
});

// Reincarcarea automata a desenului la pornire
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
});


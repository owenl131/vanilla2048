

var indices = 0;

function generateIndex () {
    indices += 1;
    return indices;
}

/**
 * COLOR UTILS
 */

function hexToRGB (hex) {
    hex = hex.replace("#", "0x");
    value = parseInt(hex);
    return [(hex >> 16) % 256, (hex >> 8) % 256, hex % 256];
}

function rgbToHex (rgb) {
    str = (rgb[0] * 256 * 256 + rgb[1] * 256 + rgb[2]).toString(16);
    while (str.length < 6) {
        str = "0" + str;
    }
    return "#" + str;
}

function interpolateColor (rgb1, rgb2, progress) {
    return addVector(scaleVector(rgb1, 1 - progress), scaleVector(rgb2, progress)).map(function (x) {
        return Math.min(255, Math.max(0, parseInt(x, 10)));
    });
}

/**
 * VECTOR UTILS
 */

function scaleVector (arr, x) {
    return arr.map(function (z) { return x * z; });
}

function addVector (arr1, arr2) {
    return arr1.map(function (a, i) { return a + arr2[i]; });
}

function subtractVector (arr1, arr2) {
    return addVector(arr1, scaleVector(arr2, -1));
}

/**
 * DISPLAY UTILS
 */

function getCoord (index) {
    return index * cellSize + cellMargins;
}

function getCoordString (index) {
    return getCoord(index) + "px";
}

function setCellValue (cell, value) {
    cell.innerHTML = "<div style=\"display: table-cell; vertical-align: middle;\">" + value + "</div>";
}

function createNewTileHtmlElement (tile) {
    var elem = document.createElement("div");
    var dims = cellSize - 2 * cellMargins;
    elem.style.position = "absolute";
    elem.style.width = `${dims}px`;
    elem.style.height = `${dims}px`;
    elem.style.top = getCoordString(tile.y);
    elem.style.left = getCoordString(tile.x);
    elem.style.backgroundColor = colorScheme[tile.value][0];
    elem.style.color = colorScheme[tile.value][1];
    elem.style.opacity = "0";
    elem.style.paddingTop = "0";
    elem.style.paddingLeft = "0";
    elem.style.display = "table";
    setCellValue(elem, tile.value);
    container.appendChild(elem);
    tile.elem = elem;
    tile.anim = makeAnimation(tile, tile.x, tile.y, tile.value);
    tile.isNew = true;
    return tile;
}

/**
 * LOGIC UTILS
 */

function generateNewValue () {
    var tileProbabilities = [[2, 0.8], [4, 0.16], [8, 0.04]];
    var rng = Math.random();
    var ans = -1;
    tileProbabilities.forEach(function (item) {
        if (ans != -1) return;
        if (rng < item[1])
            ans = item[0];
        else
            rng -= item[1];
    });
    if (ans == -1)
        ans = 2;
    return ans;
}

function generateNewPosition () {
    var x = Math.floor(Math.random() * 4);
    var y = Math.floor(Math.random() * 4);
    var any = false;
    state.forEach(function (item, index) {
        if (item.anim && item.anim.endVal == 0) {
            return;
        }
        if (item.x == x && item.y == y) {
            any = true;
        }
    });
    if (any) {
        return generateNewPosition();
    }
    return [x, y];
}

function generateNewObject () {
    let ret = new Object();
    let pos = generateNewPosition();
    ret.x = pos[0];
    ret.y = pos[1];
    ret.value = generateNewValue();
    ret.index = generateIndex();
    return ret;
}

function enumerateCells (dir) {
    var ret = [];
    if (dir == "Down") {
        for (var y = 3; y >= 0; y--) for (var x = 0; x < 4; x++) ret.push([x, y]);
    }
    if (dir == "Up") {
        for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) ret.push([x, y]);
    }
    if (dir == "Right") {
        for (var x = 3; x >= 0; x--) for (var y = 0; y < 4; y++) ret.push([x, y]);
    }
    if (dir == "Left") {
        for (var x = 0; x < 4; x++) for (var y = 0; y < 4; y++) ret.push([x, y]);
    }
    return ret;
}

function dirStringToVector (dir) {
    if (dir == "Up") return [0, -1];
    if (dir == "Down") return [0, 1];
    if (dir == "Left") return [-1, 0];
    if (dir == "Right") return [1, 0];
}

function interpolateCurve (x) {
    return (x * x) * (3.0 - 2.0 * x);
}

function animateCell (cell) {
    if (cell.anim == null) return;
    var status = cell.anim.status;
    status += cell.anim.inc;
    if (status >= 1) {
        endAnimation(cell);
    }
    else {
        var x = interpolateCurve(status);
        var pos = addVector(
            scaleVector(cell.anim.initPos, 1 - x),
            scaleVector(cell.anim.finalPos, x));
        cell.elem.style.left = pos[0] + "px";
        cell.elem.style.top = pos[1] + "px";
        cell.elem.style.backgroundColor = rgbToHex(interpolateColor(cell.anim.initCol, cell.anim.finalCol, x));
        cell.anim.status = status;
    }
}

function deleteCell (cell) {
    var elem = cell.elem;
    elem.parentNode.removeChild(elem);
    state = state.filter(function (value) {
        return value.index != cell.index;
    });
}

function endAnimation (cell) {
    if (cell.anim == null) return;
    if (cell.isNew) {
        cell.elem.style.opacity = "1";
        cell.isNew = false;
    }
    if (cell.anim.endVal == 0) {
        deleteCell(cell);
        return;
    }
    cell.elem.style.left = cell.anim.finalPos[0] + "px";
    cell.elem.style.top = cell.anim.finalPos[1] + "px";
    cell.elem.style.backgroundColor = rgbToHex(cell.anim.finalCol);
    cell.elem.style.color = colorScheme[cell.anim.endVal][1];
    cell.elem.style.fontSize = sizeScheme[cell.anim.endVal][0];
    cell.value = cell.anim.endVal;
    setCellValue(cell.elem, cell.anim.endVal);
    cell.anim = null;
}

function getCellAt (pos) {
    for (var i = 0; i < state.length; i++) {
        if (state[i].x == pos[0] && state[i].y == pos[1]) {
            return state[i];
        }
    }
    return null;
}

function inBounds (start) {
    if (start[0] < 0 || start[0] >= 4) return false;
    if (start[1] < 0 || start[1] >= 4) return false;
    return true;
}

function nextFrom (start, dir) {
    if (!inBounds(start)) return null;
    var tmp = getCellAt(start);
    if (tmp != null) return tmp;
    return nextFrom(addVector(start, dir), dir);
}

function makeAnimation (cell, newx, newy, value) {
    return {
        finalX: newx,
        finalY: newy,
        initPos: [getCoord(cell.x), getCoord(cell.y)],
        finalPos: [getCoord(newx), getCoord(newy)],
        status: 0,
        inc: 0.1,
        initCol: hexToRGB(colorScheme[cell.value][0]),
        finalCol: hexToRGB(colorScheme[value][0]),
        endVal: value
    };
}

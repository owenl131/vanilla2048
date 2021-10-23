
var keys = [];

function hasKey () {
    return keys.length > 0;
}

function extractKey () {
    return keys.shift();
}

function nextKey () {
    return keys[0];
}

function addKey (key) {
    keys.push(key);
}

document.onkeydown = function (e) {
    e = e || window.event;
    var key = e.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(key) == -1)
        return;
    addKey(key.slice(5));
}

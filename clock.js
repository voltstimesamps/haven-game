let count = 0;

export function formatClock (stepCount) {
    let minutes = Math.floor(stepCount / 3600);
    let seconds = Math.floor((stepCount / 60) % 60);
    let leftover = stepCount % 60;
    let milliseconds = Math.floor(leftover * 1000 / 60);
    return minutes + ":" + pad(seconds, 2) + "." +  pad(milliseconds, 3);
}

export function tickClock() {
    count++;
}

export function getClock() {
    return count;
}

export function resetClock() {
    count = 0;
}

function pad(c, goalLength) {
    let text = String(c);
    while (text.length < goalLength){
        text = "0" + text;
    }
    return (text);
}

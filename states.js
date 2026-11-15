import { formatClock, tickClock, getClock, resetClock } from "./clock.js";

//States for gameplay
const setup = {
    enter() {console.log("Enter: setup")},
    update() {if (kb.presses('up'))return setState('action');},
    draw() {},
    exit() {console.log("Exit: setup")},
};

const action = {
    enter() {
        console.log("Enter: action"); 
        resetClock(); 
        const startMillis = millis()},
    update() {
        tickClock(); 
        if (kb.presses('down')) {
            return setState('result'); 
        }
        tickClock();
    },
    draw() {text(formatClock(getClock()), -20, -30)},
    exit() {console.log("Exit: action")},
};

const result = {
    enter() {console.log("Enter: result")},
    update() {if (kb.presses('enter')){ return setState('setup')} else if(kb.presses('right')){console.log(formatClock(60));
    console.log(formatClock(3600));
    console.log(formatClock(727));
    console.log(formatClock(0));}},
    draw() {text(formatClock(getClock()), -20, -30)},
    exit() {console.log("Exit: result")},
};

//Defines map of states as an object of state objects
const states = { setup, action, result };
let currentState = null

export function setState(newState) {
     if (Object.hasOwn(states, newState)){
        currentState?.exit?.();
        currentState = states[newState];
        currentState.enter();
    } else {
        throw new Error("Unknown state: " + newState)
    }
}

export function updateState(){
    currentState.update()
}

export function drawState(){
    currentState.draw()
}
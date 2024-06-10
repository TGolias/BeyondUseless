import { useState } from "react";
import { Renderer } from "./Renderer";
import './App.css';
import React from "react";
import { Designer } from "./Designer";

const timeoutBeforeAddedToHistory = 5000;

const defaultPlayerConfiguration = {
  name: "Bunni Grandin",
  level: 10,
  classes: [
    {
      name: "Fighter",
      levels: 7
    },
    {
      name: "Barbarian",
      levels: 3
    }
  ],
  baseStats: {
    strength: 15,
    dexterity: 13,
    constitution: 13,
    intelligence: 8,
    wisdom: 11,
    charisma: 13
  }
}

const defaultPlayerState = {
  currentHp: 0
}

export const classes = [
  {
    name: "Barbarian",
    hitDie: 12
  },
  {
    name: "Cleric",
    hitDie: 8
  },
  {
    name: "Fighter",
    hitDie: 10
  }
]

export const backgrounds = []

export const subclasses = []

export const items = []

export const proficiencies = []

export const spells = []

export default function App() {
  const [playerConfigs, setPlayerConfigs] = useState(defaultPlayerConfiguration);
  const [isRendererViewActiveForMobile, setIsRendererViewActiveForMobile] = useState(false);
  const [history, setHistory] = useState([defaultPlayerConfiguration]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [addChangesToHistoryTimeout, setAddChangesToHistoryTimeout] = useState(null);

  function toggleViewActive() {
    setIsRendererViewActiveForMobile(!isRendererViewActiveForMobile);
  }

  function undoPlayerConfigs() {
    if (addChangesToHistoryTimeout) {
      // We want to cancel it and add it to the history. We then have to revert the state to whereever the index currently is.
      clearTimeout(addChangesToHistoryTimeout.timeout)
      setAddChangesToHistoryTimeout(null);
      addChangesToHistory(addChangesToHistoryTimeout.newState);

      const previousHistoryIndex = currentHistoryIndex;
      setCurrentHistoryIndex(previousHistoryIndex);
      const previousState = history[previousHistoryIndex];
      setPlayerConfigs(previousState);
    } else {
      // Normal undo logic in this case.
      const previousHistoryIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(previousHistoryIndex);
      const previousState = history[previousHistoryIndex];
      setPlayerConfigs(previousState);
    }
  }

  function redoPlayerConfigs() {
    const nextHistoryIndex = currentHistoryIndex + 1;
    const nextState = history[nextHistoryIndex];
    setCurrentHistoryIndex(nextHistoryIndex);
    setPlayerConfigs(nextState);
  }

  function designerChangeHandler(baseStateObject, pathToProperty, newValue) {
    let currentState = baseStateObject

    // First check if there timeout is a timeout in place.
    if (addChangesToHistoryTimeout) {
      // Regardless we want to cancel it.
      clearTimeout(addChangesToHistoryTimeout.timeout)
      setAddChangesToHistoryTimeout(null);

      if (addChangesToHistoryTimeout.pathToProperty === pathToProperty) {
        // If it IS our property being changed, since we just threw away the previous state, we want to make sure our current state is back to what it originally was so we don't add to the history when a value doesn't change at all.
        currentState = history[currentHistoryIndex];
      } else {
        // Now if this ISN'T our property being changed, we need it to add those changes to history before we start.
        addChangesToHistory(addChangesToHistoryTimeout.newState);
        currentState = addChangesToHistoryTimeout.newState;
      }
    }

    // Now do the actual logic.
    const totalPath = pathToProperty.split(/\]\.|\.|\[/);

    // We are traversing the path, but also making shallow copies all the way down for the new version of the state as we go.
    let newBaseStateObject = Object.assign({}, currentState);
    let newPropertyObject = newBaseStateObject;

    // We do - 1 to the length because we don't want to end up with the actual property at the end, just right before.
    for (let i = 0; i < totalPath.length - 1; i++) {
      let pathSegment = totalPath[i];
      const nextPropertyObject = newPropertyObject[pathSegment];

      let newNextPropertyObject
      // Sometimes some slippery arrays make their way in here... those get cloned differently.
      if (Array.isArray(nextPropertyObject)) {
        newNextPropertyObject = [...nextPropertyObject]
      } else {
        newNextPropertyObject = Object.assign({}, nextPropertyObject);
      }
      
      newPropertyObject[pathSegment] = newNextPropertyObject;
      newPropertyObject = newNextPropertyObject
    }

    // Check if the value is going to change when we set it. Important for later.
    const valueChanged = newPropertyObject[totalPath[totalPath.length - 1]] !== newValue;

    // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;
    setPlayerConfigs(newBaseStateObject);

    // We only want want to add to the undo / redo stack if the value changed.
    if (valueChanged) {
      // We want to add these changes to the history... but only after a timeout, in case they're still typing!
      const addToHistoryTimeout = setTimeout(() => { 
        addChangesToHistory(newBaseStateObject);
        // Once the timeout has done its thing, we set it to null.
        setAddChangesToHistoryTimeout(null);
      }, timeoutBeforeAddedToHistory);
      setAddChangesToHistoryTimeout({ pathToProperty: pathToProperty, newState: newBaseStateObject, timeout: addToHistoryTimeout });
    }
  }

  function addChangesToHistory(newBaseStateObject) {
    // Now time to update our history for undo / redo.
    let newHistory = history;
    if ((currentHistoryIndex + 1) < history.length) {
      // We've done one or more undos without redoing back to the present, then changed the state. We need to throw out the rest of the history in front of the current index.
      newHistory = history.slice(0, (currentHistoryIndex + 1));
      setHistory(newHistory);
    }

    newHistory.push(newBaseStateObject)
    setHistory(newHistory);
    setCurrentHistoryIndex(currentHistoryIndex + 1);
  }

  return (
    <>
      <div className="topDiv">
        <div className="activeViewButtonWrapper">
          <button className="activeViewButton" onClick={toggleViewActive}>{ isRendererViewActiveForMobile ? "Edit My Character" : "View Character Sheet"}</button>
        </div>
        <div className="viewDiv">
          <div className={"headerViewDiv" + (isRendererViewActiveForMobile ? " inactiveViewForMobile" : "")}>
            <div className="undoRedoButtonWrapper">
              <button className="undoRedoButton" onClick={undoPlayerConfigs} disabled={currentHistoryIndex === 0 && !addChangesToHistoryTimeout}>Undo</button>
              <button className="undoRedoButton" onClick={redoPlayerConfigs} disabled={(currentHistoryIndex + 1) === history.length || addChangesToHistoryTimeout}>Redo</button>
            </div>
            <div className="screenView">
              <Designer playerConfigs={playerConfigs} inputChangeHandler={designerChangeHandler}></Designer>
            </div>
          </div>
          <div className={"screenView" + (isRendererViewActiveForMobile ? "" : " inactiveViewForMobile")}>
            <Renderer playerConfigs={playerConfigs}></Renderer>
          </div>
        </div>
      </div>
    </>
  );
}

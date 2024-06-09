import { useState } from "react";
import { Designer } from "./Designer";
import { Renderer } from "./Renderer";
import './App.css';

const timeoutBeforeAddedToHistory = 5000;

const defaultPlayerConfiguration = {
  name: "Default",
  class: "Fighter",
  level: 10,
  baseStats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
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
  const [isRendererViewActiveForMobile, setIsRendererViewActiveForMobile] = useState(true);
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

      // Now if this ISN'T our property being changed, we need it to add those changes to history before we start.
      if (addChangesToHistoryTimeout.pathToProperty !== pathToProperty) {
        addChangesToHistory(addChangesToHistoryTimeout.newState);
        currentState = addChangesToHistoryTimeout.newState;
      }
    }

    // Now do the actual logic.
    const totalPath = pathToProperty.split('.');

    // We are traversing the path, but also making shallow copies all the way down for the new version of the state as we go.
    let newBaseStateObject = Object.assign({}, currentState);
    let newPropertyObject = newBaseStateObject;

    // We do - 1 to the length because we don't want to end up with the actual property at the end, just right before.
    for (let i = 0; i < totalPath.length - 1; i++) {
        const nextPropertyObject = newPropertyObject[totalPath[i]];
        const newNextPropertyObject = Object.assign({}, nextPropertyObject);
        newPropertyObject[totalPath[i]] = newNextPropertyObject;
        newPropertyObject = newNextPropertyObject
    }

    // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;
    setPlayerConfigs(newBaseStateObject);

    // We want to add these changes to the history... but only after a timeout, in case they're still typing!
    const addToHistoryTimeout = setTimeout(() => { 
      addChangesToHistory(newBaseStateObject);
      // Once the timeout has done its thing, we set it to null.
      setAddChangesToHistoryTimeout(null);
    }, timeoutBeforeAddedToHistory);
    setAddChangesToHistoryTimeout({ pathToProperty: pathToProperty, newState: newBaseStateObject, timeout: addToHistoryTimeout });
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
        <button className="activeViewButton" onClick={toggleViewActive}>{ isRendererViewActiveForMobile ? "Edit My Character" : "View My Character Sheet"}</button>
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

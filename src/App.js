import { useEffect, useState } from "react";
import { Renderer } from "./Components/MainLayoutComponents/Renderer";
import './App.css';
import React from "react";
import { Designer } from "./Components/MainLayoutComponents/Designer";
import { StartMenu } from "./Components/MainLayoutComponents/StartMenu";
import { applyEffects } from "./SharedFunctions/Effects";
import { fetchAllCollections } from "./Collections";
import { getTotalPath } from "./SharedFunctions/ComponentFunctions";
import { CenterMenu } from "./Components/MenuComponents/CenterMenu";

const timeoutBeforeAddedToHistory = 5000;

const defaultPlayerConfiguration = {
  name: "Amantine Jaune Francina",
  level: 3,
  abilityScores: {
    strength: 8,
    dexterity: 15,
    constitution: 8,
    intelligence: 10,
    wisdom: 14,
    charisma: 15
  },
  background: {
    name: "Francina Family Pedigree",
    abilityScores: {
      dexterity: 2,
      charisma: 1
    }
  },
  species: {
    name: "Elf",
    choices: {
      keenSenses: "Perception",
      elvenLineageSpellcastingAbility: "Charisma",
      elvenLineage: "High Elf"
    }
  },
  languages: ["Common", "Elvish", "Giant"],
  classes: [
    {
      name: "Paladin",
      levels: 3,
      choices: {
        classSkills: ["Persuasion", "Insight"]
      }
    }
  ],
  items: [
    {
      name: "Amulet of Health",
      equipped: true
    },
    {
      name: "Shield",
      equipped: true
    },
    {
      name: "Studded Leather Armor",
      equipped: true
    }
  ],
  currentStatus: {
  }
}

let needsToLoad = true;

export default function App() {
  const newPlayerConfigsJsonString = localStorage.getItem("CURRENT_CHARACTER");
  let startingPlayerConfigs = newPlayerConfigsJsonString ? JSON.parse(newPlayerConfigsJsonString) : defaultPlayerConfiguration;

  // Force the default.
  //startingPlayerConfigs = defaultPlayerConfiguration;

  const [isLoading, setLoading] = useState(false);

  const [playerConfigs, setPlayerConfigs] = useState(startingPlayerConfigs);
  const [history, setHistory] = useState([startingPlayerConfigs]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const [hideEditor, setHideEditor] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [centerScreenMenu, setCenterScreenMenu] = useState({ show: false, menuType: undefined });
  const [addChangesToHistoryTimeout, setAddChangesToHistoryTimeout] = useState(null);

  useEffect(() => {
    if (needsToLoad) {
      setLoading(true);
      needsToLoad = false;
      fetchAllCollections().then(() => {
        setLoading(false);
      });
    }
  });

  function toggleViewActive() {
    setHideEditor(!hideEditor);
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

  function stateChangeHandler(baseStateObject, pathToProperty, newValue) {
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
    const totalPath = getTotalPath(pathToProperty);

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

    // For certain properties, we may want to apply some effects to the state before we do the final calculations. For example, if the level is pulled below what the classes have, we want to fix that up. We do this before the value is set so that comparisons can be done.
    applyEffects(newBaseStateObject, pathToProperty, newValue);

    // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;

    // Now we can set the new configs!
    setPlayerConfigs(newBaseStateObject);

    console.log("New State:");
    console.log(newBaseStateObject);

    localStorage.setItem("CURRENT_CHARACTER", JSON.stringify(newBaseStateObject));

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

  const startMenuItems = [
    {
      text: (matchMedia('only screen and (max-width: 1200px)').matches ? (hideEditor ? "EDIT CHAR" : "VIEW CHAR") : (hideEditor ? "SHOW EDIT" : "HIDE EDIT")),
      clickHandler: () => { 
        toggleViewActive();
        setShowStartMenu(false);
      }
    },
    {
      text: "UNDO",
      disabled: (currentHistoryIndex === 0 && !addChangesToHistoryTimeout),
      clickHandler: undoPlayerConfigs
    },
    {
      text: "REDO",
      disabled: (currentHistoryIndex + 1) === history.length || addChangesToHistoryTimeout,
      clickHandler: redoPlayerConfigs
    },
    {
      text: "SAVE",
      clickHandler: () => {
        localStorage.setItem("SAVED_CHARACTER", JSON.stringify(playerConfigs));
        setShowStartMenu(false);
      }
    },
    {
      text: "LOAD",
      clickHandler: () => {
        const newPlayerConfigsJsonString = localStorage.getItem("SAVED_CHARACTER");

        // See if we even have a character to load.
        if (newPlayerConfigsJsonString) {
          // Before we load, we want to make sure there aren't any pending changes waiting to be added to history, that would be tragic.
          if (addChangesToHistoryTimeout) {
            clearTimeout(addChangesToHistoryTimeout.timeout)
            setAddChangesToHistoryTimeout(null);
          }

          const newPlayerConfigs = JSON.parse(newPlayerConfigsJsonString);
          setPlayerConfigs(newPlayerConfigs);
          setHistory([newPlayerConfigs]);
          setCurrentHistoryIndex(0);
          setShowStartMenu(false);
        }
      }
    },
    {
      text: "GITHUB",
      clickHandler: () => window.open("https://github.com/TGolias/BeyondUseless")
    },
    {
      text: "EXIT",
      clickHandler: () => setShowStartMenu(false)
    }
  ]

  if (needsToLoad || isLoading) {
    return (<>
      <div>Loading...</div>
    </>)
  }

  return (
    <>
      <div className={"topDiv" + ((showStartMenu || centerScreenMenu.show) ? " disableActivity" : "")}>
        <div className="topBar">
          <div className="appname" onClick={() => window.open("https://github.com/TGolias/BeyondUseless")}>Beyond<br></br>Useless</div>
          <div className="startMenuButton" onClick={() => setShowStartMenu(true)}><div></div>MENU</div>
        </div>
        <div className="viewDiv">
          <div className={"screenView" + (hideEditor ? " inactiveView" : "")}>
            <Designer playerConfigs={playerConfigs} inputChangeHandler={stateChangeHandler}></Designer>
          </div>
          <div className={"screenView" + (hideEditor ? "" : " inactiveViewForMobile")}>
            <Renderer playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu}></Renderer>
          </div>
        </div>
      </div>
      <div className={"startMenu" + (showStartMenu ? "" : " hide")}>
        <StartMenu menuItems={startMenuItems}></StartMenu>
      </div>
      <div className={"centerMenuWrapper" + (centerScreenMenu.show ? "" : " hide")}>
        <div className="centerMenu pixel-corners">
          <CenterMenu playerConfigs={playerConfigs} menuType={centerScreenMenu.menuType} setCenterScreenMenu={setCenterScreenMenu} inputChangeHandler={stateChangeHandler}></CenterMenu>
        </div>
      </div>
    </>
  );
}

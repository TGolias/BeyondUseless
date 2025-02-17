import React, { useEffect, useReducer, useState } from "react";
import { Renderer } from "./Components/MainLayoutComponents/Renderer";
import './App.css';
import { Designer } from "./Components/MainLayoutComponents/Designer";
import { StartMenu } from "./Components/MainLayoutComponents/StartMenu";
import { applyEffectsAfterValueChange, applyEffectsBeforeValueChange } from "./SharedFunctions/Effects";
import { fetchAllCollections, getCollection } from "./Collections";
import { getTotalPath } from "./SharedFunctions/ComponentFunctions";
import { CenterMenu } from "./Components/MenuComponents/CenterMenu";
import { getHomePageUrl, isNumeric, playAudio } from "./SharedFunctions/Utils";
import { DeathScreenDisplay } from "./Components/DisplayComponents/DeathScreenDisplay";
import { SpellPageComponent } from "./Components/PageComponents/SpellPageComponent";
import { ItemPageComponent } from "./Components/PageComponents/ItemPageComponent";
import { getItemFromItemTemplate } from "./SharedFunctions/TabletopMathFunctions";
import { RetroButton } from "./Components/SimpleComponents/RetroButton";
import { PropertyPageComponent } from "./Components/PageComponents/PropertyPageComponent";
import { MasteryPageComponent } from "./Components/PageComponents/MasteryPageComponent";

const timeoutBeforeAddedToHistory = 5000;

const rightTriangleUnicode = '\u25B6';

const defaultPlayerConfiguration = {
  name: "New Character",
  level: 1,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  background: {},
  species: {},
  languages: ["Common",null,null],
  classes: [],
  items: [],
  currentStatus: {
  }
}

let needsToLoad = true;
let storageListenerAdded = false;

export default function App() {
  const [, forceUpdate] = useReducer(x => !x, false);
  const [isLoading, setLoading] = useState(false);

  const [playerConfigs, setPlayerConfigs] = useState(getCurrentCharacterFromStorageOrDefault());
  const [history, setHistory] = useState([playerConfigs]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  let hideEditorLocalStorage = localStorage.getItem("HIDE_EDITOR");
  const startingValueForHideEditor = hideEditorLocalStorage === "true";

  const [hideEditor, setHideEditor] = useState(startingValueForHideEditor);

  let muteSoundLocalStorage = localStorage.getItem("MUTE_SOUND");
  const startingValueForMuteSound = muteSoundLocalStorage === "true";
  if (startingValueForMuteSound) {
    muteSound(startingValueForMuteSound);
  }

  const [isSoundMuted, setSoundMuted] = useState(startingValueForMuteSound);

  const [showStartMenu, setShowStartMenu] = useState(false);
  const [centerScreenMenu, setCenterScreenMenu] = useState({ show: false, menuType: undefined, data: undefined });
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

  // Listen for changes in local storage in the case of multiple windows / one browser window and another in app.
  if (!storageListenerAdded) {
    // The 'listener' attribute is just so that the looping event listener only gets applied once...
    storageListenerAdded = true;
    window.addEventListener('storage', (event) => {
      if (event.key === "CURRENT_CHARACTER") {
        // The configs for the current character were changed in a different window... Let's do this the easy way and refresh the view.
        window.location.reload();
      }
    });
  }

  const url = new URL(decodeURI(window.location.href));
  const params = new URLSearchParams(url.search);
  const view = params.get('view');
  if (view) {
    // First... Hold on if we are loading.
    if (needsToLoad || isLoading) {
      startLoadingAnimationIfNotStarted();
      return (<>
        <div className="loadingIndicatorHolder">
          <div id="loadingIndicator"></div>
        </div>
      </>);
    }

    let decodedData = undefined;
    const data = params.get('data');
    if (data) {
      const stringifiedJson = data;
      decodedData = JSON.parse(stringifiedJson);
    }

    const lowerCaseMode = view.toLowerCase();
    switch (lowerCaseMode) {
      case "spell":
        const spellName = params.get('name');
        let spellNameLower = spellName.toLowerCase();

        let spellFound = undefined;
        const cantrips = getCollection("cantrips");
        spellFound = cantrips.find(spell => spell.name.toLowerCase() === spellNameLower);
        if (!spellFound) {
          const spells = getCollection("spells");
          spellFound = {...spells.find(spell => spell.name.toLowerCase() === spellNameLower)};
        }

        if (!spellFound) {
          return (<>
            <div>Spell '{spellName}' not found :(</div>
          </>)
        } else {
          const copyLinkToSpell = {};
          return (<>
            <div className="viewPage">
              <span className="viewPageLabel">
                <RetroButton text={spellFound.name} onClickHandler={() => {
                  if (copyLinkToSpell.onExecute) {
                    copyLinkToSpell.onExecute();
                  }
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"X"} onClickHandler={() => {
                  // Send them back to the home page.
                  window.history.pushState(null, "", getHomePageUrl());
                  forceUpdate();
                }} showTriangle={false} disabled={false}></RetroButton>
              </span>
              <SpellPageComponent spell={spellFound} data={decodedData} copyLinkToSpell={copyLinkToSpell}></SpellPageComponent>
            </div>
          </>);
        }
      case "item":
        const itemName = params.get('name');
        let itemNameLower = itemName.toLowerCase();

        let itemFound = undefined;
        const items = getCollection("items");
        itemFound = items.find(item => item.name.toLowerCase() === itemNameLower);
        itemFound = getItemFromItemTemplate(itemFound);

        if (!itemFound) {
          return (<>
            <div>Item '{itemName}' not found :(</div>
          </>)
        } else {
          const copyLinkToItem = {};
          return (<>
            <div className="viewPage">
              <span className="viewPageLabel">
                <RetroButton text={itemFound.name} onClickHandler={() => {
                  if (copyLinkToItem.onExecute) {
                    copyLinkToItem.onExecute();
                  }
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"X"} onClickHandler={() => {
                  // Send them back to the home page.
                  window.history.pushState(null, "", getHomePageUrl());
                  forceUpdate();
                }} showTriangle={false} disabled={false}></RetroButton>
              </span>
              <ItemPageComponent item={itemFound} data={decodedData} copyLinkToItem={copyLinkToItem} setCenterScreenMenu={setCenterScreenMenu}></ItemPageComponent>
            </div>
            <div className={"centerMenuWrapper" + (centerScreenMenu.show ? "" : " hide")}>
              <div className="centerMenu pixel-corners">
                <CenterMenu playerConfigs={playerConfigs} menuType={centerScreenMenu.menuType} data={centerScreenMenu.data} setCenterScreenMenu={setCenterScreenMenu} inputChangeHandler={stateChangeHandler}></CenterMenu>
              </div>
            </div>
          </>);
        }
      case "property":
        const propertyName = params.get('name');
        let propertyNameLower = propertyName.toLowerCase();

        const properties = getCollection("properties");
        const propertyFound = properties.find(property => property.name.toLowerCase() === propertyNameLower);

        if (!propertyFound) {
          return (<>
            <div>Property '{propertyName}' not found :(</div>
          </>)
        } else {
          const copyLinkToItem = {};
          return (<>
            <div className="viewPage">
              <span className="viewPageLabel">
                <RetroButton text={propertyFound.name} onClickHandler={() => {
                  if (copyLinkToItem.onExecute) {
                    copyLinkToItem.onExecute();
                  }
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"X"} onClickHandler={() => {
                  // Send them back to the home page.
                  window.history.pushState(null, "", getHomePageUrl());
                  forceUpdate();
                }} showTriangle={false} disabled={false}></RetroButton>
              </span>
              <PropertyPageComponent property={propertyFound} data={decodedData} copyLinkToItem={copyLinkToItem}></PropertyPageComponent>
            </div>
          </>);
        }
      case "mastery":
        const masteryName = params.get('name');
        let masteryNameLower = masteryName.toLowerCase();

        const masteries = getCollection("masteries");
        const masteryFound = masteries.find(mastery => mastery.name.toLowerCase() === masteryNameLower);

        if (!masteryFound) {
          return (<>
            <div>Mastery '{masteryFound}' not found :(</div>
          </>)
        } else {
          const copyLinkToItem = {};
          return (<>
            <div className="viewPage">
              <span className="viewPageLabel">
                <RetroButton text={masteryFound.name} onClickHandler={() => {
                  if (copyLinkToItem.onExecute) {
                    copyLinkToItem.onExecute();
                  }
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"X"} onClickHandler={() => {
                  // Send them back to the home page.
                  window.history.pushState(null, "", getHomePageUrl());
                  forceUpdate();
                }} showTriangle={false} disabled={false}></RetroButton>
              </span>
              <MasteryPageComponent mastery={masteryFound} data={decodedData} copyLinkToItem={copyLinkToItem}></MasteryPageComponent>
            </div>
          </>);
        }
      default: {
        return (<>
          <div>View '{view}' not found :(</div>
        </>)
      }
    }
  }

  function toggleViewActive() {
    localStorage.setItem("HIDE_EDITOR", (!hideEditor) ? "true" : "false");
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

  function showDeathScreen() {
    playAudio("youdiedaudio");

    var deathScreenWrapper = document.getElementById("deathScreenWrapper");
    var deathScreenContainer = document.getElementById("deathScreenContainer");
    var deathScreenText = document.getElementById("deathScreenText");

    deathScreenWrapper.classList.add("show");
    deathScreenContainer.classList.add("zoom");
    deathScreenText.classList.add("zoom");

    setTimeout(function () {
      deathScreenWrapper.classList.remove("show");
    }, 3000);

    setTimeout(function () {
      deathScreenContainer.classList.remove("zoom");
      deathScreenText.classList.remove("zoom");
    }, 6000);
  }

  function muteSound(value) {
    const audioElements = document.getElementsByTagName("audio");

    for (let i = 0; i < audioElements.length; i++) {
      const audioElement = audioElements.item(i);
      audioElement.muted = value;
    }
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
      
      if (nextPropertyObject === undefined) {
        // This object didn't exist on the previous version of the state. We need to make a new one, but we have to figure out if it's an array or object first.
        const nextPath = totalPath[i + 1];
        if (isNumeric(nextPath)) {
          newNextPropertyObject = [];
        } else {
          newNextPropertyObject = {};
        }
      }
      else {
        // Sometimes some slippery arrays make their way in here... those get cloned differently.
        if (Array.isArray(nextPropertyObject)) {
          newNextPropertyObject = [...nextPropertyObject]
        } else {
          newNextPropertyObject = Object.assign({}, nextPropertyObject);
        }
      }
      
      newPropertyObject[pathSegment] = newNextPropertyObject;
      newPropertyObject = newNextPropertyObject
    }

    // Check if the value is going to change when we set it. Important for later.
    const valueChanged = newPropertyObject[totalPath[totalPath.length - 1]] !== newValue;

    // For certain properties, we may want to apply some effects to the state before we do the final calculations. For example, if the level is pulled below what the classes have, we want to fix that up. We do this before the value is set so that comparisons can be done.
    applyEffectsBeforeValueChange(newBaseStateObject, pathToProperty, newValue);

    // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;

    // We also may have some other values we adjust now that the value has changed.
    applyEffectsAfterValueChange(newBaseStateObject);

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
      text: "NEW",
      clickHandler: () => {
        if (addChangesToHistoryTimeout) {
          clearTimeout(addChangesToHistoryTimeout.timeout)
          setAddChangesToHistoryTimeout(null);
        }

        const newPlayerConfigs = defaultPlayerConfiguration;
        setPlayerConfigs(newPlayerConfigs);
        setHistory([newPlayerConfigs]);
        setCurrentHistoryIndex(0);
        setShowStartMenu(false);

        localStorage.setItem("CURRENT_CHARACTER", JSON.stringify(newPlayerConfigs));
      }
    },
    {
      text: "SAVE",
      buttonSound: "saveaudio",
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

          localStorage.setItem("CURRENT_CHARACTER", newPlayerConfigsJsonString);
        }
      }
    },
    {
      text: (isSoundMuted ? "SOUND ON" : "SOUND OFF"),
      clickHandler: () => {
        const newMuteValue = !isSoundMuted;
        localStorage.setItem("MUTE_SOUND", newMuteValue ? "true" : "false");
        setSoundMuted(newMuteValue);
        muteSound(newMuteValue);
        setShowStartMenu(false);
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
    startLoadingAnimationIfNotStarted();
    return (<>
      <div className="topDiv">
        <div className="topBar">
          <div className="appname" onClick={() => window.open("https://github.com/TGolias/BeyondUseless")}>Beyond<br></br>Useless</div>
          <div className="startMenuButton"><div></div>MENU</div>
        </div>
        <br></br>
        <div id="loadingIndicator" className="loadingIndicator"></div>
      </div>
    </>)
  }
  return (
    <>
      <div className={"topDiv" + ((showStartMenu || centerScreenMenu.show) ? " disableActivity" : "")}>
        <div className="topBar">
          <div className="appname" onClick={() => window.open("https://github.com/TGolias/BeyondUseless")}>Beyond<br></br>Useless</div>
          <div className="startMenuButton" onClick={() => {
            playAudio("menuaudio");
            setShowStartMenu(true)
          }}><div></div>MENU</div>
        </div>
        <div className="viewDiv">
          <div className={"screenView" + (hideEditor ? " inactiveView" : "")}>
            <Designer playerConfigs={playerConfigs} inputChangeHandler={stateChangeHandler}></Designer>
          </div>
          <div className={"screenView" + (hideEditor ? "" : " inactiveViewForMobile")}>
            <Renderer playerConfigs={playerConfigs} inputChangeHandler={stateChangeHandler} setCenterScreenMenu={setCenterScreenMenu} showDeathScreen={showDeathScreen}></Renderer>
          </div>
        </div>
      </div>
      <div className={"startMenu" + (showStartMenu ? "" : " hide")}>
        <StartMenu menuItems={startMenuItems}></StartMenu>
      </div>
      <div className={"centerMenuWrapper" + (centerScreenMenu.show ? "" : " hide")}>
        <div className="centerMenu pixel-corners">
          <CenterMenu playerConfigs={playerConfigs} menuType={centerScreenMenu.menuType} data={centerScreenMenu.data} setCenterScreenMenu={setCenterScreenMenu} inputChangeHandler={stateChangeHandler}></CenterMenu>
        </div>
      </div>
      <div id="deathScreenWrapper" className="deathScreenWapper">
        <DeathScreenDisplay></DeathScreenDisplay>
      </div>
    </>
  );
}

function startLoadingAnimationIfNotStarted() {
  let isLoading = document.documentElement.getAttribute("data-is-loading");
  if (!isLoading) {
    document.documentElement.setAttribute("data-is-loading", "true");
    startLoadingAnimation();
  }
}

function startLoadingAnimation(timeout = 0) {
  setTimeout(function () {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.innerText = "Loading\n\n" + getLoadingCurrentString();
      startLoadingAnimation(200);
    } else {
      document.documentElement.removeAttribute("data-is-loading");
    }
  }, timeout);
}

function getLoadingCurrentString() {
  let loadingIndexString = document.documentElement.getAttribute("data-loading-string");
  let loadingIndex;
  if (isNumeric(loadingIndexString)) {
    loadingIndex = parseInt(loadingIndexString);
  } else {
    loadingIndex = 0;
  }

  if (loadingIndex > 10) {
    loadingIndex = 0;
  }

  let stringToDisplay = "";
  for (let i = 0; i < 10; i++) {
    if (i === loadingIndex) {
      stringToDisplay += rightTriangleUnicode;
    } else {
      stringToDisplay += ".";
    }
  }

  loadingIndex++;
  document.documentElement.setAttribute("data-loading-string", loadingIndex.toString());

  return stringToDisplay;
}

function getCurrentCharacterFromStorageOrDefault() {
  const newPlayerConfigsJsonString = localStorage.getItem("CURRENT_CHARACTER");
  let startingPlayerConfigs;
  try {
    let parsedJson = JSON.parse(newPlayerConfigsJsonString);
    if (parsedJson && 
        parsedJson.name && 
        parsedJson.level && 
        parsedJson.abilityScores && 
        parsedJson.background && 
        parsedJson.species && 
        parsedJson.languages && 
        parsedJson.classes && 
        parsedJson.items && 
        parsedJson.currentStatus) {
      startingPlayerConfigs = parsedJson;
    } else {
      startingPlayerConfigs = defaultPlayerConfiguration;
    }
  }
  catch {
    startingPlayerConfigs = defaultPlayerConfiguration;
  }
  return startingPlayerConfigs;
}
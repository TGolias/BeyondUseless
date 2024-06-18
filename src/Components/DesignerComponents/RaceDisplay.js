import React from "react";
import './RaceDisplay.css'
import { ChoiceDisplay } from "./ChoiceDisplay";
import { getCollection } from "../../Collections";

const rightTriangleUnicode = '\u25B6';

const capitalizedAbilityScoreNames = {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma"
}

export function RaceDisplay({baseStateObject, inputHandler}) {
    const races = getCollection("races");
    const dndrace = races.find(x => x.name === baseStateObject.race.name);

    const languageRows = [];
    for (let i = 0; i < dndrace.languages.length; i++) {
        languageRows.push(<>
            <div>{rightTriangleUnicode + dndrace.languages[i]}</div>
        </>)
    }

    const resistanceRows = [];
    if (dndrace.resistances) {
        for (let i = 0; i < dndrace.resistances.length; i++) {
            resistanceRows.push(<>
                <div>{rightTriangleUnicode + dndrace.resistances[i]}</div>
            </>)
        }
    }

    const abilityScoreIncreases = [];
    if (dndrace.abilityIncrease) {
        for (const [key, value] of Object.entries(dndrace.abilityIncrease)) {
            const capitalizeValueForDisplay = capitalizedAbilityScoreNames[key];
            abilityScoreIncreases.push(<>
                <div>{rightTriangleUnicode}{capitalizeValueForDisplay} +{value}</div>
            </>)
        }
    }

    return (<>
        <div className="raceDisplayer">
            <div>Speed: {dndrace.speed}</div>
            <div>Size: {dndrace.size}</div>
            <div>
                <div className="raceAttributeLabel">Languages:</div>
                <div>{languageRows}</div>
            </div>
            <div style={{display: (resistanceRows.length ? "block" : "none")}}>
                <div className="raceAttributeLabel">Resistances:</div>
                <div>{resistanceRows}</div>
            </div>
            <div style={{display: (abilityScoreIncreases.length ? "block" : "none")}}>
                <div className="raceAttributeLabel">Stat Increases:</div>
                <div>{abilityScoreIncreases}</div>
            </div>
            <div style={{display: (dndrace.choices ? "block" : "none")}}>
                <ChoiceDisplay baseStateObject={baseStateObject} choiceObject={dndrace} pathToPlayerChoices={"race.choices."} inputHandler={inputHandler}></ChoiceDisplay>
            </div>
        </div>
    </>)
}
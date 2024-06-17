import React from "react";
import './RaceDisplay.css'
import { races } from "../../App";
import { ChoiceDisplay } from "./ChoiceDisplay";

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
    const dndrace = races.find(x => x.name === baseStateObject.race.name);

    let languageRows = [];
    for (let i = 0; i < dndrace.languages.length; i++) {
        languageRows.push(<>
            <div>{rightTriangleUnicode + dndrace.languages[i]}</div>
        </>)
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
            <div style={{display: (abilityScoreIncreases && abilityScoreIncreases.length ? "block" : "none")}}>
                <div className="raceAttributeLabel">Stat Increases:</div>
                <div>{abilityScoreIncreases}</div>
            </div>
            <div style={{display: (dndrace.choices ? "block" : "none")}}>
                <ChoiceDisplay baseStateObject={baseStateObject} choiceObject={dndrace} pathToPlayerChoices={"race.choices."} inputHandler={inputHandler}></ChoiceDisplay>
            </div>
        </div>
    </>)
}
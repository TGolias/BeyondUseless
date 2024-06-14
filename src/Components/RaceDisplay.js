import React from "react";
import './RaceDisplay.css'
import { races } from "../App";
import { SelectList } from "./SelectList";
import { getItemSource, getValueFromObjectAndPath } from "../SharedFunctions/ComponentFunctions";
import { convertArrayOfStringsToHashMap } from "../SharedFunctions/Utils";
import { calculateAspectCollection } from "../SharedFunctions/TabletopMathFunctions";

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

    const choices = [];
    if (dndrace.choices) {
        for (let i = 0; i < dndrace.choices.length; i++) {
            const choice = dndrace.choices[i];
            const pathToProperty = "race.choices." + choice.property;

            const sourceOptions = getItemSource(choice.optionsSource);
            let optionDisplayStrings = sourceOptions.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));
            if (choice.options) {
                let constrainedOptionDisplayStrings = choice.options.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));
                if (choice.optionsSource === "CUSTOM") {
                    optionDisplayStrings = constrainedOptionDisplayStrings;
                } else {
                    // We want to include the current value in the array in the case of multiple selections.\
                    const currentChoiceValue = getValueFromObjectAndPath(baseStateObject, pathToProperty)

                    // Filter our source options based on what is in the constrained options.
                    const constrainedOptionDisplayStringsHashMap = convertArrayOfStringsToHashMap(constrainedOptionDisplayStrings);
                    const filteredOptionDisplayStrings = []
                    for (let j = 0; j < optionDisplayStrings.length; j++) {
                        const optionDisplayString = optionDisplayStrings[j];
                        if (constrainedOptionDisplayStringsHashMap[optionDisplayString] || optionDisplayString === currentChoiceValue) {
                            filteredOptionDisplayStrings.push(optionDisplayString);
                        }
                    }
                    optionDisplayStrings = filteredOptionDisplayStrings;
                }
            }
            choices.push(<>
                <div className="raceAttributeLabel" style={{display: (choice.description ? "block" : "none")}}>{choice.description}</div>
                <SelectList options={optionDisplayStrings} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToProperty} inputHandler={inputHandler}></SelectList>
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
            <div style={{display: (abilityScoreIncreases.length ? "block" : "none")}}>
                <div className="raceAttributeLabel">Stat Increases:</div>
                <div>{abilityScoreIncreases}</div>
            </div>
            <div>{choices}</div>
        </div>
    </>)
}
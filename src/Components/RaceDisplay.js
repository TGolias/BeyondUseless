import React from "react";
import './RaceDisplay.css'
import { races } from "../App";
import { SelectList } from "./SelectList";
import { getValueFromObjectAndPath } from "../SharedFunctions/ComponentFunctions";
import { convertArrayOfStringsToHashMap } from "../SharedFunctions/Utils";
import { calculateAspectCollection, getAllAspectOptions } from "../SharedFunctions/TabletopMathFunctions";

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

            const sourceOptions = getAllAspectOptions(choice.optionsSource);
            let optionDisplayStrings = sourceOptions.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));

            // We don't want to be able to select any aspect values that we currently already have selected through other means.
            const alreadySelectedValues = calculateAspectCollection(baseStateObject, choice.optionsSource);
            const alreadySelectedValueDisplayStrings = alreadySelectedValues.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));
            const alreadySelectedValueDisplayStringsHashMap = convertArrayOfStringsToHashMap(alreadySelectedValueDisplayStrings);
            // -But, we want to include the current value in the array in the case of multiple selections.
            const currentChoiceValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

            const optionDisplayStringsThatHaventBeenSelected = [];
            for (const optionDisplayString of optionDisplayStrings) {
                if (!alreadySelectedValueDisplayStringsHashMap[optionDisplayString] || optionDisplayString === currentChoiceValue) {
                    optionDisplayStringsThatHaventBeenSelected.push(optionDisplayString);
                }
            }
            optionDisplayStrings = optionDisplayStringsThatHaventBeenSelected;

            if (choice.options) {
                let constrainedOptionDisplayStrings = choice.options.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));
                if (choice.optionsSource === "CUSTOM") {
                    optionDisplayStrings = constrainedOptionDisplayStrings;
                } else {
                    // We also want to filter our source options based on what is in the constrained options.
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

            if (choice.constrainToOtherChoices) {
                // If we constrain this against other choices we need to remove already selected values.
                const choiceConstrainedHashMap = {};
                for (const choiceToConstrain of choice.constrainToOtherChoices) {
                    const choiceDisplayText = baseStateObject.race.choices[choiceToConstrain];
                    choiceConstrainedHashMap[choiceDisplayText] = true;
                }

                const optionDisplayStringsThatAreNotConstrainted = [];
                for (const optionDisplayString of optionDisplayStrings) {
                    if (!choiceConstrainedHashMap[optionDisplayString] || optionDisplayString === currentChoiceValue) {
                        optionDisplayStringsThatAreNotConstrainted.push(optionDisplayString);
                    }
                }
                optionDisplayStrings = optionDisplayStringsThatAreNotConstrainted;
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
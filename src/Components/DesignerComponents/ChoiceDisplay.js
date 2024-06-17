import React from "react";
import "./ChoiceDisplay.css"
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { calculateAspectCollection, getAllAspectOptions } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayOfStringsToHashMap } from "../../SharedFunctions/Utils";
import { SelectList } from "../SimpleComponents/SelectList";

export function ChoiceDisplay({baseStateObject, choiceObject, pathToPlayerChoices, inputHandler}) {
    const choices = [];
    for (let i = 0; i < choiceObject.choices.length; i++) {
        const choice = choiceObject.choices[i];
        const pathToProperty = pathToPlayerChoices + choice.property;

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
                const pathToPropertyToConstrainAround = pathToPlayerChoices + choiceToConstrain;
                const choiceDisplayText = getValueFromObjectAndPath(baseStateObject, pathToPropertyToConstrainAround);
                if (choiceDisplayText) {
                    choiceConstrainedHashMap[choiceDisplayText] = true;
                }
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
            <div className="choiceLabel" style={{display: (choice.description ? "block" : "none")}}>{choice.description}</div>
            <SelectList options={optionDisplayStrings} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToProperty} inputHandler={inputHandler}></SelectList>
        </>);

        // Your choice can have choices... Yo dawg...
        if (currentChoiceValue && choice.options) {
            const chosenOption = choice.options.find(x => x[choice.optionDisplayProperty] === currentChoiceValue);
            if (chosenOption && chosenOption.choices) {
                console.log(chosenOption);
                choices.push(<>
                    <ChoiceDisplay baseStateObject={baseStateObject} choiceObject={chosenOption} pathToPlayerChoices={pathToPlayerChoices} inputHandler={inputHandler}></ChoiceDisplay>
                </>);
            }
        }
    }
    return <div>{choices}</div>;
}
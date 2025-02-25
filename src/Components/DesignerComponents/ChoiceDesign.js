import React from "react";
import "./ChoiceDesign.css"
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { calculateAspectCollection, getAllAspectOptions, performBooleanCalculation, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayOfStringsToHashMap, isNumeric } from "../../SharedFunctions/Utils";
import { SelectList } from "../SimpleComponents/SelectList";
import { FeatureDesign } from "./FeatureDesign";

const rightTriangleUnicode = '\u25B6';

const customOptionDisplays = [
    {
        displayName: "Resistances:",
        aspects: [
            {
                name: "resistances",
                preAppendString: "",
                multiLine: true
            }
        ],
    },
    {
        displayName: "Base Speed:",
        aspects: [
            {
                name: "speed",
                preAppendString: "",
                multiLine: false
            }
        ],
    },
    {
        displayName: "Darkvision:",
        aspects: [
            {
                name: "darkvision",
                preAppendString: "",
                multiLine: false
            }
        ],
    }
]

export function ChoiceDesign({baseStateObject, choiceObject, pathToPlayerChoices, inputHandler}) {
    if (!choiceObject) {
        return (<><div></div></>);
    } 

    const choices = [];
    if (choiceObject.choices) {
        for (let i = 0; i < choiceObject.choices.length; i++) {
            const choice = choiceObject.choices[i];
            const pathToProperty = pathToPlayerChoices + choice.property;

            let sourceOptions = getAllAspectOptions(choice.optionsSource);
            if (choice.optionsSourceFilter) {
                sourceOptions = sourceOptions.filter(option => {
                    return performBooleanCalculation(baseStateObject, choice.optionsSourceFilter, { option })
                });
            }

            let optionDisplayStrings = sourceOptions.map(x => getValueFromObjectAndPath(x, choice.optionDisplayProperty));

            // We don't want to be able to select any aspect values that we currently already have selected through other means.
            let alreadySelectedValues;
            const aspectToFilter = Object.keys(choice.choiceToAttributesMapping).find(aspectName => choice.choiceToAttributesMapping[aspectName] === choice.optionDisplayProperty);
            if (aspectToFilter) {
                alreadySelectedValues = calculateAspectCollection(baseStateObject, aspectToFilter);
            } else {
                alreadySelectedValues = [];
            }
            
            const alreadySelectedValueDisplayStringsHashMap = convertArrayOfStringsToHashMap(alreadySelectedValues);
            // -But, we want to include the current value in the array in the case of multiple selections.
            const currentChoiceValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

            const singleChoice = []
            if (choice.multipleSelections) {
                let numberOfSelections;
                if (isNumeric(choice.multipleSelections)) {
                    numberOfSelections = choice.multipleSelections;
                } else {
                    numberOfSelections = performMathCalculation(baseStateObject, choice.multipleSelections.calculation);
                }

                const selectLists = [];
                for (let i = 0; i < choice.multipleSelections; i++) {
                    const valueForSelection = currentChoiceValue ? currentChoiceValue[i] : undefined;
                    selectLists.push(createSelectList(baseStateObject, pathToProperty + "[" + i + "]", inputHandler, choice, pathToPlayerChoices, optionDisplayStrings, alreadySelectedValueDisplayStringsHashMap, valueForSelection));
                }
                singleChoice.push(<div className="multipleSelectLists">{selectLists}</div>)
            } else {
                singleChoice.push(createSelectList(baseStateObject, pathToProperty, inputHandler, choice, pathToPlayerChoices, optionDisplayStrings, alreadySelectedValueDisplayStringsHashMap, currentChoiceValue));
            }
            

            choices.push(<>
                <div className="singleChoiceWrapper">
                    <div className="choiceLabel" style={{display: (choice.description ? "block" : "none")}}>{choice.description}</div>
                    {singleChoice}
                </div>
            </>);

            
            if (choice.optionsSource === "CUSTOM" && choice.options && currentChoiceValue) {
                // If a current option is picked, we're going to try and display what the chosen option does.
                const chosenOption = choice.options.find(x => x[choice.optionDisplayProperty] === currentChoiceValue);

                if (choice.generateCustomOptionSummary) {
                    // It is not straightforward to understand what this choice does. Give a summary after the selection.
                    for (const customOptionDisplay of customOptionDisplays) {
                        const collectionValues = [];
                        for (const aspect of customOptionDisplay.aspects) {
                            const choiceToAttributeMapping = choice.choiceToAttributesMapping[aspect.name];
                            if (choiceToAttributeMapping) {
                                const aspectValue = chosenOption[choiceToAttributeMapping];
                                if (aspectValue) {
                                    if (Array.isArray(aspectValue)) {
                                        // It is an array.
                                        for (const aspectValueValue of aspectValue) {
                                            collectionValues.push(aspect.preAppendString + aspectValueValue);
                                        }
                                    } else {
                                        // It is a property
                                        collectionValues.push(aspect.preAppendString + aspectValue);
                                    }
                                }
                            }
                        }
                        if (collectionValues.length > 0) {
                            const aspectDisplay = []
                            if (customOptionDisplay.multiLine) {
                                aspectDisplay.push(<>
                                    <div className="choiceLabel">{customOptionDisplay.displayName}</div>
                                </>);
                                for (const collectionValue of collectionValues) {
                                    aspectDisplay.push(<><div className="singleChoiceWrapper">
                                        <div>{rightTriangleUnicode + collectionValue}</div>
                                    </div></>);
                                }
                            } else {
                                aspectDisplay.push(<>
                                    <div className="choiceLabel">{customOptionDisplay.displayName + " " + collectionValues}</div>
                                </>);
                            }
                            

                            choices.push(<>
                                <div>{aspectDisplay}</div>
                            </>);
                        }
                    }
                }

                if (chosenOption) {
                    // Your choice can have choices... Yo dawg...
                    if (chosenOption.choices) {
                        choices.push(<>
                            <div className="singleChoiceWrapper">
                                <ChoiceDesign baseStateObject={baseStateObject} choiceObject={chosenOption} pathToPlayerChoices={pathToPlayerChoices} inputHandler={inputHandler}></ChoiceDesign>
                            </div>
                        </>);
                    }

                    // Your choice can also have features... Great...
                    if (choice.choiceToAttributesMapping && choice.choiceToAttributesMapping.features && chosenOption[choice.choiceToAttributesMapping.features]) {
                        const chosenOptionFeatures = chosenOption[choice.choiceToAttributesMapping.features];

                        const pathToChoiceFeatures = pathToPlayerChoices + choice.choiceToAttributesMapping.features;
                        const baseFeatureChoiceObject = getValueFromObjectAndPath(baseStateObject, pathToChoiceFeatures);

                        for (let chosenOptionFeature of chosenOptionFeatures) {
                            if (!chosenOptionFeature.level || chosenOptionFeature.level <= baseStateObject.level) {
                                const featurePropertyName = chosenOptionFeature.name.replace(/\s/g, "") + chosenOptionFeature.level;
                                const playerFeatureObject = baseFeatureChoiceObject ? baseFeatureChoiceObject[featurePropertyName] : undefined;
                                choices.push(<>
                                    <div className="singleChoiceWrapper">
                                        <div className="choiceLabel">{"Level " + chosenOptionFeature.level + " - " + chosenOptionFeature.name}</div>
                                        <FeatureDesign baseStateObject={baseStateObject} inputHandler={inputHandler} feature={chosenOptionFeature} playerFeatureObject={playerFeatureObject} pathToFeatureProperty={pathToChoiceFeatures + "." + featurePropertyName + "."}></FeatureDesign>
                                    </div>
                                </>);
                            }
                        }
                    }
                }
            }
        }
    }
    return <div className="choiceDisplayer">{choices}</div>;
}

function createSelectList(baseStateObject, pathToProperty, inputHandler, choice, pathToPlayerChoices, optionDisplayStrings, alreadySelectedValueDisplayStringsHashMap, currentChoiceValue) {
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

    return <SelectList options={optionDisplayStrings} isNumberValue={false} baseStateObject={baseStateObject} pathToProperty={pathToProperty} inputHandler={inputHandler}></SelectList>
}
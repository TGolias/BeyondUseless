import React from "react";
import './UserInputsComponent.css'
import { performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { TextInput } from "../SimpleComponents/TextInput";
import { CheckListInput } from "../SimpleComponents/CheckListInput";

const userInputTypes = {
    numberField: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = 0;
            }

            const min = singleUserInput.min ? performMathCalculation(playerConfigs, singleUserInput.min, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            const max = singleUserInput.max ? performMathCalculation(playerConfigs, singleUserInput.max, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler} minimum={min} maxiumum={max}></TextInput>
                </div>
            </>);
        }
    },
    checkboxList: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = [];
            }

            const allCheckboxValues = performMathCalculation(playerConfigs, singleUserInput.values, { userInput: menuConfig.userInput, resource: menuConfig.resource });
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <CheckListInput baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler} values={allCheckboxValues}></CheckListInput>
                </div>
            </>);
        }
    }
}

export function UserInputsComponent({playerConfigs, menuConfig, menuStateChangeHandler}) {

    let userInput = [];
    const spellOrFeatureActionUserInput = getUserInputForSpellOrFeatureAction(menuConfig);
    if (spellOrFeatureActionUserInput) {
        for (let singleUserInput of spellOrFeatureActionUserInput) {
            userInput.push(userInputTypes[singleUserInput.type].generateControl(playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler));
        }
    }

    return (<>
        <div className="userInputsWrapperDiv">{userInput}</div>
    </>);
}

function getUserInputForSpellOrFeatureAction(menuConfig) {
    if (menuConfig.spell) {
        // This is a spell.
        return menuConfig.spell.userInput;
    } else {
        // This is a feature action.
        return menuConfig.featureAction.userInput;
    }
}
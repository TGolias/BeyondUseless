import React from "react";
import './UserInputsComponent.css'
import { performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { TextInput } from "../SimpleComponents/TextInput";
import { CheckListInput } from "../SimpleComponents/CheckListInput";
import { SelectList } from "../SimpleComponents/SelectList";

const userInputTypes = {
    textField: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = "";
            }

            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <TextInput isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler}></TextInput>
                </div>
            </>);
        }
    },
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
    },
    selectList: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = undefined;
            }

            const allSelectListValues = performMathCalculation(playerConfigs, singleUserInput.values, { userInput: menuConfig.userInput, resource: menuConfig.resource });
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <SelectList options={allSelectListValues} isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler}></SelectList>
                </div>
            </>);
        }
    }
}

export function UserInputsComponent({playerConfigs, menuConfig, userInputConfig, menuStateChangeHandler}) {

    let userInput = [];
    if (userInputConfig) {
        for (let singleUserInput of userInputConfig) {
            userInput.push(userInputTypes[singleUserInput.type].generateControl(playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler));
        }
    }

    return (<>
        <div style={{display: (userInput.length ? "flex" : "none")}} className="userInputsWrapperDiv">{userInput}</div>
    </>);
}
import React from "react";
import './UserInputsComponent.css'
import { getSpellcastingLevel, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { TextInput } from "../SimpleComponents/TextInput";
import { CheckListInput } from "../SimpleComponents/CheckListInput";
import { SelectList } from "../SimpleComponents/SelectList";
import { UseSpellSlotComponent } from "./UseSpellSlotComponent";
import { getCollection } from "../../Collections";

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
                menuConfig.userInput[singleUserInput.name] = singleUserInput.startingValue ? performMathCalculation(playerConfigs, singleUserInput.startingValue, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : 0;
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
    },
    consumeSpellSlot: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = singleUserInput.startingValue ? performMathCalculation(playerConfigs, singleUserInput.startingValue, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            }

            const minLevel = singleUserInput.minLevel ? performMathCalculation(playerConfigs, singleUserInput.minLevel, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : 1;
            if (!menuConfig.useSpellSlotLevel) {
                menuConfig.useSpellSlotLevel = minLevel;
            }

            let spellcastingLevel = 0
            let spellSlotsRemainingForSlotLevel = 0
            let slotLevelPropertyPath = undefined;
            let haveSpellSlotsForNextLevel = false;
            if (minLevel) {
                spellcastingLevel = getSpellcastingLevel(playerConfigs);
                if (spellcastingLevel > 0) {
                    const spellSlotsForEachLevel = getCollection("spellslots");
                    const spellcastingIndex = spellcastingLevel - 1;
                    const allSpellSlotsForThisLevel = spellSlotsForEachLevel[spellcastingIndex];
                    slotLevelPropertyPath = "slotLevel" + menuConfig.useSpellSlotLevel;
                    haveSpellSlotsForNextLevel = allSpellSlotsForThisLevel["slotLevel" + (menuConfig.useSpellSlotLevel + 1)];
                    if (playerConfigs.currentStatus && playerConfigs.currentStatus.remainingSpellSlots && playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                        spellSlotsRemainingForSlotLevel = playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
                    } else {
                        // We have all the slots remaining.
                        spellSlotsRemainingForSlotLevel = allSpellSlotsForThisLevel[slotLevelPropertyPath];
                    }
                }
            }

            return (<>
                <div className="userInputsSingleInput userInputsMaxWidthChild">
                    <UseSpellSlotComponent spellcastingLevel={spellcastingLevel} minSpellLevel={minLevel} spellSlotsRemainingForSlotLevel={spellSlotsRemainingForSlotLevel} haveSpellSlotsForNextLevel={haveSpellSlotsForNextLevel} hasFreeUses={false} remainingFreeUses={0} isRitual={false} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseSpellSlotComponent>
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
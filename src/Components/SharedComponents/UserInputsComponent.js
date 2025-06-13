import React from "react";
import './UserInputsComponent.css'
import { calculateHitDiceMap, getPactSlotLevel, getSpellcastingLevel, performBooleanCalculation, performDiceRollCalculation, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { TextInput } from "../SimpleComponents/TextInput";
import { CheckListInput } from "../SimpleComponents/CheckListInput";
import { SelectList } from "../SimpleComponents/SelectList";
import { UseSpellSlotComponent } from "./UseSpellSlotComponent";
import { getCollection } from "../../Collections";
import { playAudio } from "../../SharedFunctions/Utils";

const userInputTypes = {
    textField: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, "");
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
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, 0);
            }

            const min = singleUserInput.min ? performMathCalculation(playerConfigs, singleUserInput.min, { ...data, resource: menuConfig.resource }) : undefined;
            const max = singleUserInput.max ? performMathCalculation(playerConfigs, singleUserInput.max, { ...data, resource: menuConfig.resource }) : undefined;
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler} minimum={min} maxiumum={max}></TextInput>
                </div>
            </>);
        }
    },
    checkboxList: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, []);
            }

            const allCheckboxValues = performMathCalculation(playerConfigs, singleUserInput.values, { ...data, resource: menuConfig.resource });
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <CheckListInput baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler} values={allCheckboxValues}></CheckListInput>
                </div>
            </>);
        }
    },
    selectList: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, undefined);
            }
            
            let allSelectListValues = performMathCalculation(playerConfigs, singleUserInput.values, { ...data, resource: menuConfig.resource });
            if (singleUserInput.optionFilter) {
                allSelectListValues = allSelectListValues.filter(option => performBooleanCalculation(playerConfigs, singleUserInput.optionFilter, { option }));
            }
            if (singleUserInput.optionDisplayProperty) {
                allSelectListValues = allSelectListValues.map(option => option[singleUserInput.optionDisplayProperty]);
            }
            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    <SelectList options={allSelectListValues} isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler}></SelectList>
                </div>
            </>);
        }
    },
    consumeSpellSlot: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            const minLevel = singleUserInput.minLevel ? performMathCalculation(playerConfigs, singleUserInput.minLevel, { ...data, resource: menuConfig.resource }) : 1;
            if (!menuConfig.useSpellSlotLevel) {
                menuStateChangeHandler(menuConfig, "useSpellSlotLevel", minLevel);
            }

            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, minLevel);
            }

            let spellcastingLevel = 0
            let spellSlotsRemainingForSlotLevel = 0
            let pactSlotsRemaining = 0;
            let pactSlotCastLevel = 0;
            let slotLevelPropertyPath = undefined;
            let haveSpellSlotsForNextLevel = false;
            if (minLevel) {
                const pactSlotLevel = getPactSlotLevel(playerConfigs);
                if (pactSlotLevel > 0) {
                    const pactSlotsForEachLevel = getCollection("pactslots");
                    const pactSlotsForThisLevel = pactSlotsForEachLevel[pactSlotLevel - 1];
                    pactSlotCastLevel = pactSlotsForThisLevel.slotLevel;
                    if (playerConfigs.currentStatus && playerConfigs.currentStatus.remainingPactSlots || playerConfigs.currentStatus.remainingPactSlots === 0) {
                        pactSlotsRemaining = playerConfigs.currentStatus.remainingPactSlots;
                    } else {
                        pactSlotsRemaining = pactSlotsForThisLevel.pactSlots;
                    }
                }

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
                    <UseSpellSlotComponent spellcastingLevel={spellcastingLevel} minSpellLevel={minLevel} spellSlotsRemainingForSlotLevel={spellSlotsRemainingForSlotLevel} haveSpellSlotsForNextLevel={haveSpellSlotsForNextLevel} pactSlotsRemaining={pactSlotsRemaining} pactSlotCastLevel={pactSlotCastLevel} hasFreeUses={false} remainingFreeUses={0} isRitual={false} menuConfig={menuConfig} menuStateChangeHandler={(baseStateObject, pathToProperty, newValue) => {
                        if (pathToProperty === "usePactSlot") {
                            menuConfig.usePactSlot = newValue;
                            menuConfig.userInput[singleUserInput.name] = pactSlotCastLevel;
                        } else if (pathToProperty === "useSpellSlotLevel") {
                            menuConfig.useSpellSlotLevel = newValue;
                            menuConfig.userInput[singleUserInput.name] = menuConfig.useSpellSlotLevel;
                        }
                        
                        menuStateChangeHandler(menuConfig, "", menuConfig);
                    }}></UseSpellSlotComponent>
                </div>
            </>);
        }
    },
    consumeHitDice: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data) => {
            if (!menuConfig.userInput.hasOwnProperty(singleUserInput.name)) {
                menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, 0);
            }

            const min = singleUserInput.min ? performMathCalculation(playerConfigs, singleUserInput.min, { ...data, resource: menuConfig.resource }) : undefined;
            const max = singleUserInput.max ? performMathCalculation(playerConfigs, singleUserInput.max, { ...data, resource: menuConfig.resource }) : undefined;

            let totalToBeExpendedString = "";
            let totalDiceUsedNow = 0;
            let totalDiceCalculation = [];
            
            const hitDiceMap = calculateHitDiceMap(playerConfigs);
            const hitDiceControls = [];
        
            const oldExpendedDice = playerConfigs.currentStatus.remainingHitDice ?? {};
        
            for (let hitDieType of Object.keys(hitDiceMap)) {
                const singleHitDieRows = [];
        
                const totalDice = hitDiceMap[hitDieType];
                const diceUsedPrior = oldExpendedDice[hitDieType] ?? 0;
        
                const totalDiceToExpendNow = totalDice - diceUsedPrior;
                const diceUsedIncludingNow = menuConfig?.remainingHitDice && menuConfig?.remainingHitDice[hitDieType] ? menuConfig?.remainingHitDice[hitDieType] : 0;
                const diceUsedNow = diceUsedIncludingNow - diceUsedPrior;
                const remainingDiceToExpendNow = totalDiceToExpendNow - diceUsedNow;

                let calculationForDieType = {
                    type: "dieRoll",
                    value: parseInt(hitDieType),
                    multiplier: [
                        {
                            type: "static",
                            value: diceUsedNow
                        }
                    ]
                }
                totalDiceCalculation.push(calculationForDieType);
        
                if (diceUsedNow > 0) {
                    totalDiceUsedNow += diceUsedNow;
                    if (totalToBeExpendedString.length > 0) {
                        totalToBeExpendedString += " + "
                    }
                    totalToBeExpendedString += (diceUsedNow + "d" + hitDieType);
                }
        
                singleHitDieRows.push(<div>{"d" + hitDieType + " total: " + totalDice}</div>);
                if (diceUsedPrior > 0) {
                    singleHitDieRows.push(<div>{"Expended prior: " + diceUsedPrior}</div>);
                }
                if (totalDiceToExpendNow > 0) {
                    let expendedUsesString = "";
                    for (let i = 0; i < totalDiceToExpendNow; i++) {
                        if (i == 10) {
                            expendedUsesString += "\n";
                        }
        
                        if (i < diceUsedNow) {
                            expendedUsesString += "X";
                        } else {
                            expendedUsesString += "O";
                        }
                    }
        
                    singleHitDieRows.push(<div>{"Available to expend: " + totalDiceToExpendNow}</div>);
                    singleHitDieRows.push(<div className="hitDiceToExpend">{expendedUsesString}</div>)
                }
        
                hitDiceControls.push(<>
                    <div onClick={() => {
                        if (remainingDiceToExpendNow > 0 && totalDiceUsedNow < max) {
                            if (!menuConfig.remainingHitDice) {
                                menuConfig.remainingHitDice = {}
                            }

                            menuConfig.remainingHitDice[hitDieType] = diceUsedIncludingNow + 1;

                            calculationForDieType.multiplier[0].value = diceUsedNow + 1

                            menuConfig.userInput[singleUserInput.name] = performDiceRollCalculation(playerConfigs, totalDiceCalculation)[""];
                            menuStateChangeHandler(menuConfig, "", menuConfig);
                            playAudio("selectionaudio");
                        }
                    }}>{singleHitDieRows}</div>
                </>)
            }

            return (<>
                <div className="userInputsSingleInput">
                    <div>{singleUserInput.displayName}</div>
                    {hitDiceControls}
                </div>
            </>);
        }
    }
}

export function UserInputsComponent({playerConfigs, menuConfig, userInputConfig, menuStateChangeHandler, data}) {

    let userInput = [];
    if (userInputConfig) {
        for (let singleUserInput of userInputConfig) {
            userInput.push(userInputTypes[singleUserInput.type].generateControl(playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler, data));
        }
    }

    return (<>
        <div style={{display: (userInput.length ? "flex" : "none")}} className="userInputsWrapperDiv">{userInput}</div>
    </>);
}
import React from "react";
import './UseOnSelfComponent.css'
import { calculateFeatureActionType, calculateHPMax, calculateOtherFeatureActionAspect, calculateOtherSpellAspect } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayOfStringsToHashMap, isNumeric } from "../../SharedFunctions/Utils";
import { TextInput } from "../SimpleComponents/TextInput";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ConditionsDisplay } from "../DisplayComponents/ConditionsDisplay";

export function UseOnSelfComponent({newPlayerConfigs, oldPlayerConfigs, menuConfig, menuStateChangeHandler}) {
    let useOnSelfControls = [];
    if (menuConfig.usingOnSelf) {
        if (doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "healing")) {
            const maxHp = calculateHPMax(newPlayerConfigs);

            let remainingHp;
            if (oldPlayerConfigs.currentStatus.remainingHp === undefined) {
                remainingHp = maxHp;
            } else {
                remainingHp = oldPlayerConfigs.currentStatus.remainingHp
            }

            const healAmountString = calculateAspectForSpellOrFeatureAction(newPlayerConfigs, menuConfig, "healing", "healingBonus");
            if (isNumeric(healAmountString)) {
                // This is a static value, set it to the heal amount.
                menuConfig.healAmount = healAmountString ? parseInt(healAmountString) : 0;
            } else if (healAmountString) {
                // This is a dynamic string that includes a dice roll, give an input to put the healing amount in.
                useOnSelfControls.push(<>
                    <div className="useOnSelfComponentHealAmount">
                        <div>Heal Amount</div>
                        <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"healAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>
                    </div>
                </>);
            } else {
                // There is no value... Set it to 0.
                menuConfig.healAmount = 0;
            }

            let newRemainingHp = remainingHp + menuConfig.healAmount;
            if (newRemainingHp > maxHp) {
                newRemainingHp = maxHp;
            }

            newPlayerConfigs.currentStatus.remainingHp = newRemainingHp;
        }

        if (doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "tempHp")) {
            const tempHpString = calculateAspectForSpellOrFeatureAction(newPlayerConfigs, menuConfig, "tempHp", "tempHpBonus");
            if (isNumeric(tempHpString)) {
                // This is a static value, set it to the heal amount.
                menuConfig.tempHpAmount = tempHpString ? parseInt(tempHpString) : 0;
            } else if (tempHpString) {
                // This is a dynamic string that includes a dice roll, give an input to put the temp hp amount in.
                useOnSelfControls.push(<>
                    <div className="useOnSelfComponentHealAmount">
                        <div>Temp HP Amount</div>
                        <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"tempHpAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>
                    </div>
                </>);
            } else {
                // There is no value... Set it to 0.
                menuConfig.tempHpAmount = 0;
            }

            if (oldPlayerConfigs.currentStatus.tempHp && oldPlayerConfigs.currentStatus.tempHp > menuConfig.tempHpAmount) {
                // Their current temp HP is already better off than what we're giving them.
                menuConfig.tempHpAmount = oldPlayerConfigs.currentStatus.tempHp;
            }

            newPlayerConfigs.currentStatus.tempHp = menuConfig.tempHpAmount;
        }

        if (doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "restore")) {
            const restore = calculateAspectForSpellOrFeatureAction(newPlayerConfigs, menuConfig, "restore", "restoreBonus");
            if (restore) {
                const allConditionsRestored = restore.split(/, | and | or /g);;
                if (allConditionsRestored) {
                    const conditionsRestoredMap = convertArrayOfStringsToHashMap(allConditionsRestored.filter(condition => condition));
                    if (Object.keys(conditionsRestoredMap).length > 0 && newPlayerConfigs.currentStatus.conditions) {
                        newPlayerConfigs.currentStatus.conditions = [...newPlayerConfigs.currentStatus.conditions].filter(condition => !conditionsRestoredMap[condition.name]);
                    }
                }
            }
        }

        useOnSelfControls.push(<>
            <HPandLVLDisplay playerConfigs={newPlayerConfigs} playLowHpAudio={false}></HPandLVLDisplay>
            <ConditionsDisplay conditions={newPlayerConfigs.currentStatus.conditions ?? []}></ConditionsDisplay>
            <RetroButton text={"Not Using on Self?"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "usingOnSelf", false)}} showTriangle={false} disabled={false}></RetroButton>
        </>);
    } else {
        menuConfig.healAmount = 0;
        menuConfig.tempHp = 0;
        if (doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "healing") || doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "restore") || doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, "tempHp")) {
            useOnSelfControls.push(<>
                <RetroButton text={"Use on Self?"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "usingOnSelf", true)}} showTriangle={false} disabled={false}></RetroButton>
            </>);
        }
    }

    return (<div style={{display: (useOnSelfControls.length ? "flex" : "none")}} className="useOnSelfComponentWrapper">{useOnSelfControls}</div>);
}

function doesSpellOrFeatureActionTypeInclude(newPlayerConfigs, menuConfig, typeToCheck) {
    if (menuConfig.spell) {
        return menuConfig.spell.type && menuConfig.spell.type.includes(typeToCheck);
    } else if (menuConfig.featureAction) {
        const featureActionType = calculateFeatureActionType(newPlayerConfigs, menuConfig.featureAction);
        return featureActionType && featureActionType.includes(typeToCheck);
    } else if (menuConfig.item) {
        if (menuConfig.item.consumeEffect) {
            return menuConfig.item.consumeEffect.type && menuConfig.item.consumeEffect.type.includes(typeToCheck);
        }
        if (menuConfig.item.spell) {
            return menuConfig.item.spell.type && menuConfig.item.spell.type.includes(typeToCheck);
        }
    }
    return false;
}

function calculateAspectForSpellOrFeatureAction(newPlayerConfigs, menuConfig, aspectName, aspectBonusName) {
    if (menuConfig.spell) {
        // This is a spell.
        return calculateOtherSpellAspect(newPlayerConfigs, menuConfig.spell, menuConfig.useSpellSlotLevel, aspectName, aspectBonusName, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
    } else if (menuConfig.featureAction) {
        // This is a feature action.
        return calculateOtherFeatureActionAspect(newPlayerConfigs, menuConfig.featureAction, aspectName, aspectBonusName, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
    } else { // if (menuConfig.item) {
        if (menuConfig.item.consumeEffect) {
            // This is an item consumeEffect.
            return calculateOtherFeatureActionAspect(newPlayerConfigs, menuConfig.item.consumeEffect, aspectName, aspectBonusName, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
        } else  {// if (menuConfig.item.spell) {
            // This is an item spell.
            return calculateOtherSpellAspect(newPlayerConfigs, menuConfig.item.spell, menuConfig.item.spell.level, aspectName, aspectBonusName, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
        }
    }
}
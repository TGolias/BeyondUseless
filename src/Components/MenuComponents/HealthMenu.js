import React from "react";
import './HealthMenu.css';
import { TextInput } from "../SimpleComponents/TextInput";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { calculateAddendumAspect, calculateAspectCollection, calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { ConditionsDisplay } from "../DisplayComponents/ConditionsDisplay";
import { getCollection, getNameDictionaryForCollection } from "../../Collections";
import { concatStringArrayToAndStringWithCommas, convertArrayToDictionary } from "../../SharedFunctions/Utils";
import { CheckIfPlayerDead, SetPlayerDead, SetPlayerRevived } from "../../SharedFunctions/DeathFunctions";
import { AddOrUpdateCondition, RemoveConditionByName } from "../../SharedFunctions/ConditionFunctions";
import { SetPlayerLongRested, SetPlayerShortRested } from "../../SharedFunctions/RestFunctions";
import { removeConcentrationFromPlayerConfigs, showConcentrationMenuIfConcentrating } from "../../SharedFunctions/ConcentrationFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

export function HealthMenu({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler, inputChangeHandler, showDeathScreen}) {
    let healthMenuAddendums = "";
    const resistancesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "resistances"));
    if (resistancesString) {
        healthMenuAddendums += "<b>Resistances:</b> " + resistancesString;
    }

    const damagetypeImmunitiesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "damagetypeImmunities"));
    if (damagetypeImmunitiesString) {
        if (healthMenuAddendums.length > 0) {
            healthMenuAddendums += "\n\n";
        }
        healthMenuAddendums += "<b>Damage Type Immunities:</b> " + damagetypeImmunitiesString;
    }

    const conditionImmunitiesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "conditionImmunities"));
    if (conditionImmunitiesString) {
        if (healthMenuAddendums.length > 0) {
            healthMenuAddendums += "\n\n";
        }
        healthMenuAddendums += "<b>Condition Immunities:</b> " + conditionImmunitiesString;
    }

    const addendumsFromAspects = calculateAddendumAspect(playerConfigs, "healthMenuAddendum", []);
    if (addendumsFromAspects) {
        if (healthMenuAddendums.length > 0) {
            healthMenuAddendums += "\n\n";
        }
        healthMenuAddendums += addendumsFromAspects;
    }

    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    playerConfigsClone.currentStatus.tempHp = menuConfig.newTempHp;
    playerConfigsClone.currentStatus.maxHpModifier = menuConfig.newMaxHpModifier;

    let maxHp = calculateHPMax(playerConfigsClone);

    // HP max can't drop below 0.
    if (maxHp < 0) {
        menuConfig.newMaxHpModifier = menuConfig.newMaxHpModifier - maxHp;
        playerConfigsClone.currentStatus.maxHpModifier = menuConfig.newMaxHpModifier;
        maxHp = 0;
    }

    if (menuConfig.newRemainingHp > maxHp) {
        menuConfig.newRemainingHp = maxHp;
    }

    playerConfigsClone.currentStatus.remainingHp = menuConfig.newRemainingHp;

    if (playerConfigsClone.currentStatus.remainingHp > 0) {
        playerConfigsClone.currentStatus.deathSavingThrowFailures = 0;
        playerConfigsClone.currentStatus.deathSavingThrowSuccesses = 0;
    }

    playerConfigsClone.currentStatus.conditions = [...menuConfig.newConditions];
    const currentConditionsMap = convertArrayToDictionary(menuConfig.newConditions, "name");
    const allConditions = getCollection("conditions");
    const allConditionsMap = getNameDictionaryForCollection("conditions");
    const notYetSelectedConditionNames = allConditions.filter(condition => !currentConditionsMap[condition.name]).map(condition => condition.name);

    const wasDead = CheckIfPlayerDead(playerConfigs);
    const willBeDead = CheckIfPlayerDead(playerConfigsClone);

    const willBeRevived = wasDead && !willBeDead;
    const willDie = !wasDead && willBeDead;

    if (willBeRevived) {
        SetPlayerRevived(playerConfigsClone);
    }
    if (willDie) {
        SetPlayerDead(playerConfigsClone);
    }

    const wasDying = playerConfigs.currentStatus.remainingHp === 0;
    const isDying = playerConfigsClone.currentStatus.remainingHp === 0;

    if (!willDie && isDying) {
        const hasUnconciousCondition = playerConfigsClone.currentStatus?.conditions ? playerConfigsClone.currentStatus.conditions.some(condition => condition.name === "Unconscious") : false;
        if (!hasUnconciousCondition) {
            const dndConditionMap = getNameDictionaryForCollection("conditions");
            const unconciousCondition = dndConditionMap["Unconscious"];
            
            const newNewConditions = AddOrUpdateCondition(menuConfig.newConditions, unconciousCondition);
            menuStateChangeHandler(menuConfig, "newConditions", newNewConditions);
        }

        // Also remove concentration.
        playerConfigsClone.currentStatus.activeEffects = playerConfigsClone.currentStatus.activeEffects ? [...playerConfigsClone.currentStatus.activeEffects] : [];
        removeConcentrationFromPlayerConfigs(playerConfigsClone);
    }
    if (!isDying) {
        const hadUnconciousCondition = playerConfigs.currentStatus?.conditions ? playerConfigs.currentStatus.conditions.some(condition => condition.name === "Unconscious") : false;
        if (!hadUnconciousCondition || wasDying) {
            const hasUnconciousCondition = playerConfigsClone.currentStatus?.conditions ? playerConfigsClone.currentStatus.conditions.some(condition => condition.name === "Unconscious") : false;
            if (hasUnconciousCondition) {
                const newNewConditions = RemoveConditionByName(menuConfig.newConditions, "Unconscious");
                menuStateChangeHandler(menuConfig, "newConditions", newNewConditions);
            }
        }
    }

    return (<>
        <div className="healthMenuHorizontal healthMenuRestAndHitDice">
            <RetroButton text="Rest" onClickHandler={() => {
                setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                    menuTitle: "Type of Rest", menuText: "Would you like to Long Rest or Short Rest?", 
                    buttons: [
                        {
                            text: "Long",
                            onClick: () => {
                                setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                                    menuTitle: "Long Rest", 
                                    menuText: "Are you sure you would like to Long Rest?", 
                                    buttons: [
                                    {
                                        text: "Confirm",
                                        sound: "longrestaudio",
                                        onClick: () => {
                                            // Clear out most of current status. There will be a couple things the stick around after a long rest, but most are cleared.
                                            SetPlayerLongRested(playerConfigsClone);
                                            inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
                                            setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                        }
                                    },
                                    {
                                        text: "Cancel",
                                        onClick: () => {
                                            setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                        }
                                    }
                                ] } });
                            }
                        },
                        {
                            text: "Short",
                            onClick: () => {
                                setCenterScreenMenu({ show: true, menuType: "HitDiceMenu", data: { 
                                    menuTitle: "Short Rest", 
                                    menuText: "Select any hit dice you'd like expend as part of your Short Rest.",
                                    soundOnHitDiceExpend: "shortrestaudio",
                                    soundOnNoHitDiceExpend: "shortrestaudio",
                                    onBeforeConfirm: (newPlayerConfigs) => {
                                        SetPlayerShortRested(newPlayerConfigs);
                                    }
                                } });
                            }
                        }
                    ] 
                } 
            });
            }} showTriangle={false} disabled={wasDead}></RetroButton>
            <RetroButton text="Hit Dice" onClickHandler={() => {
                setCenterScreenMenu({ show: true, menuType: "HitDiceMenu", data: { 
                    menuTitle: "Expend Hit Dice", 
                    menuText: "Expend hit dice outside of a Short Rest.",
                    soundOnHitDiceExpend: "healaudio",
                    soundOnNoHitDiceExpend: "selectionaudio",
                    onBeforeConfirm: (newPlayerConfigs) => {}
                } });
            }} showTriangle={false} disabled={wasDead}></RetroButton>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="healthMenuVertical healthMenuMainSection">
            <div className="healthMenuHorizontal">
                <div className="healthMenuVertical">
                    <div className="healthMenuLabel">Temp HP</div>
                    <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"newTempHp"} inputHandler={menuStateChangeHandler} minimum={0}/>
                </div>
                <div className="healthMenuVertical">
                    <div className="healthMenuLabel">Max HP +/-</div>
                    <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"newMaxHpModifier"} inputHandler={menuStateChangeHandler}/>
                </div>
            </div>
            <div style={{display: (healthMenuAddendums ? "block" : "none")}}>
                <div className="healthMenuAddendums">{parseStringForBoldMarkup(healthMenuAddendums)}</div>
            </div>
            <div className="healthMenuGrid">
                <div></div>
                <div className="healthMenuLabel">Change HP</div>
                <div></div>
                <RetroButton text="Heal" onClickHandler={() => calculateHeal(menuConfig, maxHp, menuStateChangeHandler)} showTriangle={true} disabled={menuConfig.changeHpAmount === 0 || playerConfigsClone.currentStatus.remainingHp >= maxHp} buttonSound={"healaudio"}></RetroButton>
                <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"changeHpAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>
                <RetroButton text="Damage" onClickHandler={() => calculateDamage(menuConfig, menuStateChangeHandler)} showTriangle={true} disabled={menuConfig.changeHpAmount === 0 || playerConfigsClone.currentStatus.remainingHp <= 0} buttonSound={"damageaudio"}></RetroButton>
            </div>
            <div className="healthMenuVertical">
                <div className="healthMenuLabel">Preview</div>
                <HPandLVLDisplay playerConfigs={playerConfigsClone} playLowHpAudio={false}></HPandLVLDisplay>
            </div>
            <div className="healthMenuVertical">
                <ConditionsDisplay conditions={playerConfigsClone.currentStatus.conditions} setCenterScreenMenu={(centerScreenObj) => {
                    addToMenuStack({ menuType: "HealthMenu", menuConfig });
                    setCenterScreenMenu(centerScreenObj);
                }} addConditionClicked={notYetSelectedConditionNames.length === 0 ? undefined : () => {
                    addToMenuStack({ menuType: "HealthMenu", menuConfig });
                    setCenterScreenMenu({ show: true, menuType: "SelectListMenu", data: { menuTitle: "Add Condition", menuText: "Select the condition to add:", options: notYetSelectedConditionNames, 
                        onOkClicked: (result) => {
                            const dndCondition = allConditionsMap[result];
                            addToMenuStack({ menuType: "HealthMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "ConditionMenu", data: { menuTitle: dndCondition.name, condition: dndCondition,
                                onOkClicked: (newCondition, didConfigChange) => {
                                    // Next time: Gonna need to add the player's conditions to this menuconfig. Add them here, then make sure they get set to the playerclone before we hit the confirm button.
                                    const newConditions = [...menuConfig.newConditions, newCondition];
                                    menuStateChangeHandler(menuConfig, "newConditions", newConditions);
                                }
                            } });
                        } } 
                    });
                } } onAddOrUpdate={(newCondition) => {
                    const newConditions = AddOrUpdateCondition(menuConfig.newConditions, newCondition);
                    menuStateChangeHandler(menuConfig, "newConditions", newConditions);
                }} onRemove={(conditionNameToRemove) => {
                    const newConditions = RemoveConditionByName(menuConfig.newConditions, conditionNameToRemove);
                    if (newConditions) {
                        menuStateChangeHandler(menuConfig, "newConditions", newConditions);
                    }
                }}></ConditionsDisplay>
            </div>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="healthMenuHorizontal">
            <RetroButton text="Confirm" onClickHandler={() => 
                onConfirmClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu, showDeathScreen, willDie)
            } showTriangle={false} disabled={false} buttonSound={willBeRevived ? "reviveaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>)
}

function onConfirmClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu, showDeathScreen, willDie) {
    showConcentrationMenuIfConcentrating(playerConfigs, playerConfigsClone, setCenterScreenMenu, () => {
        setStatusAndClose(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu, showDeathScreen, willDie);
    });
}

function setStatusAndClose(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu, showDeathScreen, willDie) {
    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    if (willDie) {
        showDeathScreen(playerConfigsClone);
    }
}

function calculateHeal(menuConfig, maxHp, menuStateChangeHandler) {
    let currentConfigMenu = menuConfig;
    let newHealthAmount = currentConfigMenu.newRemainingHp + currentConfigMenu.changeHpAmount;
    newHealthAmount = newHealthAmount > maxHp ? maxHp : newHealthAmount;
    currentConfigMenu = menuStateChangeHandler(currentConfigMenu, "newRemainingHp", newHealthAmount);
    menuStateChangeHandler(currentConfigMenu, "changeHpAmount", 0);
}

function calculateDamage(menuConfig, menuStateChangeHandler) {
    let currentConfigMenu = menuConfig;
    let hpToSubtract = currentConfigMenu.changeHpAmount;
    if (currentConfigMenu.newTempHp) {
        let decreasedTempHpValue = currentConfigMenu.newTempHp - hpToSubtract;
        decreasedTempHpValue = decreasedTempHpValue < 0 ? 0 : decreasedTempHpValue;

        hpToSubtract = hpToSubtract - currentConfigMenu.newTempHp;

        currentConfigMenu = menuStateChangeHandler(currentConfigMenu, "newTempHp", decreasedTempHpValue);
    }

    if (hpToSubtract > 0) {
        let newHealthAmount = currentConfigMenu.newRemainingHp - hpToSubtract;
        newHealthAmount = newHealthAmount < 0 ? 0 : newHealthAmount;
        currentConfigMenu = menuStateChangeHandler(currentConfigMenu, "newRemainingHp", newHealthAmount);
    }

    menuStateChangeHandler(currentConfigMenu, "changeHpAmount", 0);
}
import React from "react";
import './HealthMenu.css';
import { TextInput } from "../SimpleComponents/TextInput";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { calculateAspectCollection, calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";

export function HealthMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const resistancesString = calculateAspectCollection(playerConfigs, "resistances").join(", ");

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

    const wasDead = playerConfigs.currentStatus.remainingHp === 0 && playerConfigs.currentStatus?.deathSavingThrowFailures > 2;
    const willBeDead = playerConfigsClone.currentStatus.remainingHp === 0 && playerConfigs.currentStatus?.deathSavingThrowFailures > 2;

    const willBeRevived = wasDead && !willBeDead;

    return (<>
        <div className="healthMenuWrapperDiv">
            <div className="healthMenuHorizontal">
                <RetroButton text="Rest" onClickHandler={() => {
                    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                        menuTitle: "Rest Menu", menuText: "Would you like to Long Rest or Short Rest?", 
                        buttons: [
                            {
                                text: "Long Rest",
                                onClick: () => {
                                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                                        menuTitle: "Long Rest", 
                                        menuText: "Are you sure you would like to Long Rest?", 
                                        buttons: [
                                        {
                                            text: "Confirm",
                                            onClick: () => {
                                                // Clear out most of current status. There will be a couple things the stick around after a long rest, but most are cleared.
                                                playerConfigsClone.currentStatus = {};
                                                // Heroic inspiration sticks around.
                                                playerConfigsClone.currentStatus.heroicInspiration = playerConfigs.currentStatus.heroicInspiration;
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
                                text: "Short Rest",
                                onClick: () => {
                                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                }
                            }
                        ] 
                    } 
                });
                }} showTriangle={true} disabled={false}></RetroButton>
                <RetroButton text="Hit Dice" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={true} disabled={false}></RetroButton>
            </div>
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
            <div style={{display: (resistancesString ? "block" : "none")}}>
                <div>Resistances: {resistancesString}</div>
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
                <HPandLVLDisplay playerConfigs={playerConfigsClone} setCenterScreenMenu={() => {}} playLowHpAudio={false}></HPandLVLDisplay>
            </div>
            <div className="healthMenuHorizontal">
                <RetroButton text="Confirm" onClickHandler={() => {
                    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={true} disabled={false} buttonSound={willBeRevived ? "reviveaudio" : "selectionaudio"}></RetroButton>
                <RetroButton text="Cancel" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={true} disabled={false}></RetroButton>
            </div>
        </div>
    </>)
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
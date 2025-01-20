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

    const maxHp = calculateHPMax(playerConfigsClone);

    playerConfigsClone.currentStatus.remainingHp = (menuConfig.newRemainingHp > maxHp ? maxHp : menuConfig.newRemainingHp);

    return (<>
        <div className="healthMenuWrapperDiv">
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
                <RetroButton text="Heal" onClickHandler={() => calculateHeal(menuConfig, maxHp, menuStateChangeHandler)} showTriangle={true} disabled={menuConfig.changeHpAmount === 0 || playerConfigsClone.currentStatus.remainingHp >= maxHp}></RetroButton>
                <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"changeHpAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>
                <RetroButton text="Damage" onClickHandler={() => calculateDamage(menuConfig, menuStateChangeHandler)} showTriangle={true} disabled={menuConfig.changeHpAmount === 0 || playerConfigsClone.currentStatus.remainingHp <= 0}></RetroButton>
            </div>
            <div className="healthMenuVertical">
                <div className="healthMenuLabel">Preview</div>
                <HPandLVLDisplay playerConfigs={playerConfigsClone} setCenterScreenMenu={() => {}}></HPandLVLDisplay>
            </div>
            <div className="healthMenuHorizontal">
                <RetroButton text="Confirm" onClickHandler={() => {
                    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
                    setCenterScreenMenu({ show: false, menuType: undefined });
                }} showTriangle={true} disabled={false}></RetroButton>
                <RetroButton text="Cancel" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined });
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
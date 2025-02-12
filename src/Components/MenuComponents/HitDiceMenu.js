import React from "react";
import './HitDiceMenu.css';
import { calculateHitDiceMap, calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { playAudio } from "../../SharedFunctions/Utils";
import { TextInput } from "../SimpleComponents/TextInput";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";

export function HitDiceMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    let totalToBeExpendedString = "";

    const hitDiceMap = calculateHitDiceMap(playerConfigs);
    const hitDiceControls = [];

    const oldExpendedDice = playerConfigs.currentStatus.remainingHitDice ?? {};

    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    const maxHp = calculateHPMax(playerConfigsClone);
    if (playerConfigsClone.currentStatus.remainingHp === undefined) {
        playerConfigsClone.currentStatus.remainingHp = maxHp;
    }

    let newRemainingHp = playerConfigsClone.currentStatus.remainingHp + (menuConfig.healAmount ?? 0);
    if (newRemainingHp > maxHp) {
        newRemainingHp = maxHp;
    }

    playerConfigsClone.currentStatus.remainingHp = newRemainingHp;

    for (let hitDieType of Object.keys(hitDiceMap)) {
        const singleHitDieRows = [];

        const totalDice = hitDiceMap[hitDieType];
        const diceUsedPrior = oldExpendedDice[hitDieType] ?? 0;

        const totalDiceToExpendNow = totalDice - diceUsedPrior;
        const diceUsedIncludingNow = menuConfig.remainingHitDice[hitDieType] ?? 0;
        const diceUsedNow = diceUsedIncludingNow - diceUsedPrior;
        const remainingDiceToExpendNow = totalDiceToExpendNow - diceUsedNow;

        if (diceUsedNow > 0) {
            if (playerConfigsClone.currentStatus.remainingHitDice) {
                playerConfigsClone.currentStatus.remainingHitDice = {...playerConfigsClone.currentStatus.remainingHitDice};
            } else {
                playerConfigsClone.currentStatus.remainingHitDice = {};
            }
            playerConfigsClone.currentStatus.remainingHitDice[hitDieType] = diceUsedIncludingNow;

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
                if (remainingDiceToExpendNow > 0) {
                    menuStateChangeHandler(menuConfig, "remainingHitDice[" + hitDieType + "]", diceUsedIncludingNow + 1);
                    playAudio("selectionaudio");
                }
            }}>{singleHitDieRows}</div>
        </>)
    }

    const healControls = [];
    if (totalToBeExpendedString !== "") {
        // Don't add the heal controls unless any hit points were expended.
        healControls.push(<div>Heal Amount</div>);
        healControls.push(<TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"healAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>);
        healControls.push(<HPandLVLDisplay playerConfigs={playerConfigsClone} playLowHpAudio={false}></HPandLVLDisplay>);
    }

    return (<>
        <div className="hitDiceMenuWrapperDiv">
            <div className="hitDicemenuText">{menuConfig.menuText}</div>
            <div>{hitDiceControls}</div>
            <div>{totalToBeExpendedString === "" ? "No hit dice to be expended" : "Expending " + totalToBeExpendedString}</div>
            <div style={{display: (healControls.length ? "block" : "none")}}>{healControls}</div>
            <div className="centerMenuSeperator"></div>
            <div className="hitDiceMenuHorizontal">
                <RetroButton text="Confirm" onClickHandler={() => {
                    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false} buttonSound={totalToBeExpendedString === "" ? menuConfig.soundOnNoHitDiceExpend : menuConfig.soundOnHitDiceExpend }></RetroButton>
                <RetroButton text="Cancel" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </div>
    </>);
}
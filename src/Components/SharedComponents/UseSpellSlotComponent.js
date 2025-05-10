import React from "react";
import './UseSpellSlotComponent.css'
import { CircleButton } from "../SimpleComponents/CircleButton";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

export function UseSpellSlotComponent({spellcastingLevel, minSpellLevel, spellSlotsRemainingForSlotLevel, haveSpellSlotsForNextLevel, hasFreeUses, remainingFreeUses, isRitual, menuConfig, menuStateChangeHandler}) {
    return (<>
        <div style={{display: (minSpellLevel ? "flex" : "none")}} className="useSpellSlotCastingHorizontal">
            <div style={{display: (spellcastingLevel > 0 ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Cast LVL</div>
                <div className="useSpellSlotHorizontal">
                    <CircleButton text={"-"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel - 1)}} disabled={menuConfig.useFreeUse || menuConfig.useRitual || menuConfig.useSpellSlotLevel <= minSpellLevel}></CircleButton>
                    <div>{(menuConfig.useFreeUse ? "F" : (menuConfig.useRitual ? "R" : menuConfig.useSpellSlotLevel))}</div>
                    <CircleButton text={"+"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel + 1)}} disabled={menuConfig.useFreeUse || menuConfig.useRitual || !haveSpellSlotsForNextLevel}></CircleButton>
                </div>
            </div>
            <div style={{display: (spellcastingLevel > 0 ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Slots Left</div>
                <div className="slotsLeft">{spellSlotsRemainingForSlotLevel}</div>
            </div>
            <div style={{display: (hasFreeUses ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Free Use</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useFreeUse"} inputHandler={menuStateChangeHandler} disabled={menuConfig.useRitual || !remainingFreeUses}></CheckboxInput>
            </div>
            <div style={{display: (isRitual ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Ritual</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useRitual"} inputHandler={menuStateChangeHandler} disabled={menuConfig.useFreeUse}></CheckboxInput>
            </div>
        </div>
    </>);
}
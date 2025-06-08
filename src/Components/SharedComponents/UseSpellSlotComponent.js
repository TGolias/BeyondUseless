import React from "react";
import './UseSpellSlotComponent.css'
import { CircleButton } from "../SimpleComponents/CircleButton";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

export function UseSpellSlotComponent({spellcastingLevel, minSpellLevel, spellSlotsRemainingForSlotLevel, haveSpellSlotsForNextLevel, pactSlotsRemaining, hasFreeUses, remainingFreeUses, isRitual, menuConfig, menuStateChangeHandler}) {
    return (<>
        <div style={{display: (!menuConfig.usePactSlot && !menuConfig.useFreeUse && !menuConfig.useRitual ? "flex" : "none")}} className="useSpellSlotVertical">
            <div>Spell Slots Left: {spellSlotsRemainingForSlotLevel}</div>
        </div>
        <div style={{display: (menuConfig.usePactSlot ? "flex" : "none")}} className="useSpellSlotVertical">
            <div>Pact Slots Left: {pactSlotsRemaining}</div>
        </div>
        <div style={{display: (menuConfig.useFreeUse ? "flex" : "none")}} className="useSpellSlotVertical">
            <div>Free Uses Left: {remainingFreeUses}</div>
        </div>
        <div style={{display: (minSpellLevel ? "flex" : "none")}} className="useSpellSlotCastingHorizontal">
            <div style={{display: (spellcastingLevel > 0 || pactSlotsRemaining > 0 ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Cast LVL</div>
                <div className="useSpellSlotHorizontal">
                    <CircleButton text={"-"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel - 1)}} disabled={spellcastingLevel == 0 || menuConfig.usePactSlot || menuConfig.useFreeUse || menuConfig.useRitual || menuConfig.useSpellSlotLevel <= minSpellLevel}></CircleButton>
                    <div>{(menuConfig.useFreeUse ? "F" : (menuConfig.useRitual ? "R" : (menuConfig.usePactSlot ? "P" : menuConfig.useSpellSlotLevel)))}</div>
                    <CircleButton text={"+"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel + 1)}} disabled={spellcastingLevel == 0 || menuConfig.usePactSlot || menuConfig.useFreeUse || menuConfig.useRitual || !haveSpellSlotsForNextLevel}></CircleButton>
                </div>
            </div>
            <div style={{display: (pactSlotsRemaining > 0 ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Use Pact</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"usePactSlot"} inputHandler={menuStateChangeHandler} disabled={menuConfig.useFreeUse || menuConfig.useRitual || !pactSlotsRemaining}></CheckboxInput>
            </div>
            <div style={{display: (hasFreeUses ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Free Use</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useFreeUse"} inputHandler={menuStateChangeHandler} disabled={menuConfig.usePactSlot || menuConfig.useRitual || !remainingFreeUses}></CheckboxInput>
            </div>
            <div style={{display: (isRitual ? "flex" : "none")}} className="useSpellSlotVertical">
                <div>Ritual</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useRitual"} inputHandler={menuStateChangeHandler} disabled={menuConfig.usePactSlot || menuConfig.useFreeUse}></CheckboxInput>
            </div>
        </div>
    </>);
}
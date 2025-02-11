import React from "react";
import './SpellMenu.css';
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { calculateOtherSpellAspect, calculateSpellAttack, calculateSpellSaveDC, getSpellcastingLevel } from "../../SharedFunctions/TabletopMathFunctions";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { CircleButton } from "../SimpleComponents/CircleButton";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";
import { getCollection } from "../../Collections";

export function SpellMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    // Create the config for this component.
    let isRitual = false;
    if (Array.isArray(menuConfig.spell.castingTime)) {
        isRitual = menuConfig.spell.castingTime.includes("Ritual");
    } else {
        isRitual = menuConfig.spell.castingTime === "Ritual"
    }

    let remainingFreeUses = 0;
    if (menuConfig.spell.freeUses) {
        if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingFreeSpellUses && playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name] !== undefined) {
            remainingFreeUses = playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name];
        } else {
            // We have all the free uses remaining.
            remainingFreeUses = menuConfig.spell.freeUses;
        }
    }

    let spellcastingLevel = 0
    let spellSlotsRemainingForSlotLevel = 0
    let slotLevelPropertyPath = undefined;
    let haveSpellSlotsForNextLevel = false;
    if (menuConfig.spell.level) {
        spellcastingLevel = getSpellcastingLevel(playerConfigs);
        if (spellcastingLevel > 0) {
            const spellSlotsForEachLevel = getCollection("spellslots");
            const spellcastingIndex = spellcastingLevel - 1;
            const allSpellSlotsForThisLevel = spellSlotsForEachLevel[spellcastingIndex];
            slotLevelPropertyPath = "slotLevel" + menuConfig.useSpellSlotLevel;
            haveSpellSlotsForNextLevel = allSpellSlotsForThisLevel["slotLevel" + (menuConfig.useSpellSlotLevel + 1)];
            if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingSpellSlots && playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                spellSlotsRemainingForSlotLevel = playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
            } else {
                // We have all the slots remaining.
                spellSlotsRemainingForSlotLevel = allSpellSlotsForThisLevel[slotLevelPropertyPath];
            }
        }
    }

    // Create config for the spell component.
    const data = {};
    data.featureName = menuConfig.spell.feature.name;

    if (menuConfig.spell.freeUses) {
        data.freeUses = remainingFreeUses;
    }

    if (menuConfig.spell.challengeType === "attackRoll") {
        data.attackRoll = calculateSpellAttack(playerConfigs, menuConfig.spell)
    }

    if (menuConfig.spell.challengeType === "savingThrow") {
        data.savingThrow = {};
        data.savingThrow.type = menuConfig.spell.savingThrowType;
        data.savingThrow.dc = calculateSpellSaveDC(playerConfigs, menuConfig.spell);
    }

    if (menuConfig.spell.type.includes("damage")) {
        data.damage = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "damage", "spellDamageBonus");
        data.damage += " " + menuConfig.spell.damage.damageType;
    }

    if (menuConfig.spell.type.includes("buff")) {
        data.buff = {}
        if (menuConfig.spell.buff.calcuation) {
            data.buff.amount = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "buff", "buffBonus");
        }
        data.buff.description = menuConfig.spell.buff.description;
    }

    if (menuConfig.spell.type.includes("debuff")) {
        data.debuff = {}
        if (menuConfig.spell.debuff.calcuation) {
            data.debuff.amount = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "debuff", "debuffBonus");
        }
        data.debuff.description = menuConfig.spell.debuff.description;
    }

    if (menuConfig.spell.type.includes("healing")) {
        data.healing = calculateOtherSpellAspect(playerConfigs, menuConfig.spell, "healing", "healingBonus");
    }

    // Now do any modifications based on their current configuration of this menu.
    let canCastSpell = false;
    if (menuConfig.useFreeUse || menuConfig.useRitual) {
        // If using as a ritual or free use, level the spell down to its normal level.
        menuConfig.useSpellSlotLevel = menuConfig.spell.level

        if (menuConfig.useRitual) {
            canCastSpell = true;
        }

        if (menuConfig.useFreeUse) {
            // Make sure we have uses remaining.
            if (remainingFreeUses > 0) {
                // This is a free use. Stage it to add that to the current status when we hit 'cast'.
                canCastSpell = true;
                if (playerConfigsClone.currentStatus.remainingFreeSpellUses) {
                    playerConfigsClone.currentStatus.remainingFreeSpellUses = {...playerConfigsClone.currentStatus.remainingFreeSpellUses};
                } else {
                    playerConfigsClone.currentStatus.remainingFreeSpellUses = {};
                }

                if (playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name]) {
                    playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name] = {...playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name]};
                } else {
                    playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name] = {};
                }

                playerConfigsClone.currentStatus.remainingFreeSpellUses[menuConfig.spell.name] = remainingFreeUses - 1;
            }
            
        }
    } else {
        if (menuConfig.spell.level) {
            if (spellSlotsRemainingForSlotLevel > 0) {
                // We have any slots for the level we are casting it at.
                canCastSpell = true;
                if (playerConfigsClone.currentStatus.remainingSpellSlots) {
                    playerConfigsClone.currentStatus.remainingSpellSlots = {...playerConfigsClone.currentStatus.remainingSpellSlots};
                } else {
                    playerConfigsClone.currentStatus.remainingSpellSlots = {};
                }
        
                if (playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath]) {
                    playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] = {...playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath]};
                } else {
                    playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] = {};
                }

                playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] = spellSlotsRemainingForSlotLevel - 1;
            }

        } else {
            // This is a cantrip.
            canCastSpell = true;
        }
    }

    return (<>
        <div className={menuConfig.spell.level ? "spellMenuWrapperDiv" : "spellMenuWrapperDiv extraCantripSpaceDiv"}>
            <SpellPageComponent spell={menuConfig.spell} data={data}></SpellPageComponent>
        </div>
        <div style={{display: (menuConfig.spell.level ? "block" : "none")}} className="centerMenuSeperator"></div>
        <div style={{display: (menuConfig.spell.level ? "flex" : "none")}} className="spellMenuCastingHorizontal">
            <div style={{display: (spellcastingLevel > 0 ? "flex" : "none")}} className="spellMenuCastingVertical">
                <div>Cast LVL</div>
                <div className="spellMenuHorizontal">
                    <CircleButton text={"-"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel - 1)}} disabled={menuConfig.useFreeUse || menuConfig.useRitual || menuConfig.useSpellSlotLevel <= menuConfig.spell.level}></CircleButton>
                    <div>{(menuConfig.useFreeUse ? "F" : (menuConfig.useRitual ? "R" : menuConfig.useSpellSlotLevel))}</div>
                    <CircleButton text={"+"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "useSpellSlotLevel", menuConfig.useSpellSlotLevel + 1)}} disabled={menuConfig.useFreeUse || menuConfig.useRitual || !haveSpellSlotsForNextLevel}></CircleButton>
                </div>
            </div>
            <div style={{display: (spellcastingLevel > 0 ? "flex" : "none")}} className="spellMenuCastingVertical">
                <div>Slots Left</div>
                <div className="slotsLeft">{spellSlotsRemainingForSlotLevel}</div>
            </div>
            <div style={{display: (menuConfig.spell.freeUses ? "flex" : "none")}} className="spellMenuCastingVertical">
                <div>Free Use</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useFreeUse"} inputHandler={menuStateChangeHandler} disabled={menuConfig.useRitual || !remainingFreeUses}></CheckboxInput>
            </div>
            <div style={{display: (isRitual ? "flex" : "none")}} className="spellMenuCastingVertical">
                <div>Ritual</div>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"useRitual"} inputHandler={menuStateChangeHandler} disabled={menuConfig.useFreeUse}></CheckboxInput>
            </div>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="spellMenuHorizontal">
            <RetroButton text={"Cast Spell"} onClickHandler={() => {castSpellClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canCastSpell}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => { setCenterScreenMenu({ show: false, menuType: undefined, data: undefined }) }} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function castSpellClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu) {
    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
}
import React from "react";
import './SpellMenu.css';
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { getPactSlotLevel, getSpellcastingLevel } from "../../SharedFunctions/TabletopMathFunctions";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getCollection } from "../../Collections";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { UseSpellSlotComponent } from "../SharedComponents/UseSpellSlotComponent";

export function SpellMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
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
    let pactSlotsRemaining = 0;
    let pactSlotCastLevel = 0;
    let slotLevelPropertyPath = undefined;
    let haveSpellSlotsForNextLevel = false;
    if (menuConfig.spell.level) {
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
            if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingSpellSlots && playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                spellSlotsRemainingForSlotLevel = playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
            } else {
                // We have all the slots remaining.
                spellSlotsRemainingForSlotLevel = allSpellSlotsForThisLevel[slotLevelPropertyPath];
            }
        }
    }

    // Now do any modifications based on their current configuration of this menu.
    let canCastSpell = false;
    if (menuConfig.useFreeUse || menuConfig.useRitual || menuConfig.usePactSlot) {
        // If using as a ritual or free use, level the spell down to its normal level.
        menuConfig.useSpellSlotLevel = menuConfig.spell.level;

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

        if (menuConfig.usePactSlot) {
            if (pactSlotsRemaining > 0) {
                // If using as a pact slot, use the pact slot level.
                menuConfig.useSpellSlotLevel = pactSlotCastLevel;
                canCastSpell = true;
                playerConfigsClone.currentStatus.remainingPactSlots = pactSlotsRemaining - 1;
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

    // Create config for the spell component.
    const data = {};
    data.userInput = menuConfig.userInput;

    if (menuConfig.spell.freeUses) {
        data.freeUses = remainingFreeUses;
    }

    if (menuConfig.useSpellSlotLevel) {
        data.castAtLevel = menuConfig.useSpellSlotLevel;
    }

    return (<>
        <div className="spellMenuWrapperDiv">
            <SpellPageComponent spell={menuConfig.spell} data={data} playerConfigs={playerConfigs} copyLinkToSpell={menuConfig.copyLinkToSpell}></SpellPageComponent>
        </div>
        <div style={{display: (menuConfig.spell.level ? "block" : "none")}} className="centerMenuSeperator"></div>
        <UserInputsComponent playerConfigs={playerConfigsClone} menuConfig={menuConfig} data={data} menuStateChangeHandler={menuStateChangeHandler} userInputConfig={menuConfig.spell.userInput}></UserInputsComponent>
        <UseSpellSlotComponent spellcastingLevel={spellcastingLevel} minSpellLevel={menuConfig.spell.level} spellSlotsRemainingForSlotLevel={spellSlotsRemainingForSlotLevel} haveSpellSlotsForNextLevel={haveSpellSlotsForNextLevel} pactSlotsRemaining={pactSlotsRemaining} pactSlotCastLevel={pactSlotCastLevel} hasFreeUses={menuConfig.spell.freeUses} remainingFreeUses={remainingFreeUses} isRitual={isRitual} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseSpellSlotComponent>
        <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        <div className="centerMenuSeperator"></div>
        <div className="spellMenuHorizontal">
            <RetroButton text={"Cast Spell"} onClickHandler={() => {castSpellClicked(sessionId, playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canCastSpell} buttonSound={menuConfig.usingOnSelf ? "healaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => { setCenterScreenMenu({ show: false, menuType: undefined, data: undefined }) }} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function castSpellClicked(sessionId, playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu) {
    // If any hit dice are expended, put them on the new player configs.
    if (menuConfig.remainingHitDice) {
        playerConfigsClone.currentStatus.remainingHitDice = menuConfig.remainingHitDice;
    }

    tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
        inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    });
}
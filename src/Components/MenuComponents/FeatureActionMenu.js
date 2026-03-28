import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { findResource, getAdditionalFeatureActionUserInputs, getPactSlotLevel, getSpellcastingLevel, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { getCollection, getNameDictionaryForCollection } from "../../Collections";
import { GetRemainingUsesForResource, SetRemainingUsesForResource } from "../../SharedFunctions/ResourcesFunctions";
import { GetCurrentVariableValue, SetCurrentVariableValue } from "../../SharedFunctions/VariableFunctions";
import { deepCloneToMakeChange } from "../../SharedFunctions/Utils";
import { GetHeldItemsWithPlayerItem } from "../../SharedFunctions/EquipmentFunctions";

export function FeatureActionMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    if (playerConfigsClone.currentStatus.remainingResources) {
        playerConfigsClone.currentStatus.remainingResources = {...playerConfigsClone.currentStatus.remainingResources}
    } else {
        playerConfigsClone.currentStatus.remainingResources = {};
    }
    
    const data = {};
    data.userInput = menuConfig.userInput;

    const controlsDisplay = [];

    let featureActionUserInput = getAdditionalFeatureActionUserInputs(playerConfigsClone, menuConfig.origin);
    if (menuConfig.featureAction.userInput) {
        featureActionUserInput = [...featureActionUserInput, ...menuConfig.featureAction.userInput];
    } else if (menuConfig.featureAction.templateType && menuConfig.featureAction.templateOf) {
        const templateMap = getNameDictionaryForCollection(menuConfig.featureAction.templateType);
        const newFeatureAction = {...templateMap[menuConfig.featureAction.templateOf]};
        featureActionUserInput = [...featureActionUserInput, ...newFeatureAction.userInput];
    }

    controlsDisplay.push(<>
        <UserInputsComponent playerConfigs={playerConfigsClone} menuConfig={menuConfig} data={data} menuStateChangeHandler={menuStateChangeHandler} userInputConfig={featureActionUserInput}></UserInputsComponent>
    </>);

    // See if there is a spell slot input.
    let spellSlotsRemainingForSlotLevel = 0
    let spellSlotChangeAmount = 0;
    let pactSlotsRemaining = 0;
    let pactSlotsChangeAmount = 0;
    let slotLevelPropertyPath = undefined;
    let hasEnoughSpellSlots = true;

    const spellSlotConsumtionInput = menuConfig.featureAction.userInput?.find(userInput => userInput.type === "consumeSpellSlot");
    if (spellSlotConsumtionInput) {
        if (!menuConfig.useSpellSlotLevel) {
            menuConfig.useSpellSlotLevel = spellSlotConsumtionInput.minLevel ? performMathCalculation(playerConfigs, spellSlotConsumtionInput.minLevel, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : 1;
        }

        if (menuConfig.usePactSlot) {
            const pactSlotLevel = getPactSlotLevel(playerConfigsClone);
            if (pactSlotLevel > 0) {
                const pactSlotsForEachLevel = getCollection("pactslots");
                const pactSlotsForThisLevel = pactSlotsForEachLevel[pactSlotLevel - 1];
                if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingPactSlots || playerConfigsClone.currentStatus.remainingPactSlots === 0) {
                    pactSlotsRemaining = playerConfigsClone.currentStatus.remainingPactSlots;
                } else {      
                    pactSlotsRemaining = pactSlotsForThisLevel.pactSlots;
                }
                pactSlotsChangeAmount = -1;
            }
        } else {
            const spellcastingLevel = getSpellcastingLevel(playerConfigs);
            if (spellcastingLevel > 0) {
                const spellSlotsForEachLevel = getCollection("spellslots");
                const spellcastingIndex = spellcastingLevel - 1;
                const allSpellSlotsForThisLevel = spellSlotsForEachLevel[spellcastingIndex];
                slotLevelPropertyPath = "slotLevel" + menuConfig.useSpellSlotLevel;
                if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingSpellSlots && playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                    spellSlotsRemainingForSlotLevel = playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
                } else {
                    // We have all the slots remaining.
                    spellSlotsRemainingForSlotLevel = allSpellSlotsForThisLevel[slotLevelPropertyPath];
                }
            }

            if (spellSlotsRemainingForSlotLevel <= 0) {
                hasEnoughSpellSlots = false;
            } else {
                spellSlotChangeAmount = -1;
            }
        }
    }
    
    // See if there is a restore spell slot.
    if (menuConfig.featureAction.type.includes("restoreSpellSlot")) {
        if (menuConfig.featureAction.restoreSpellSlot.slotType === "pactSlots") {
            const pactSlotLevel = getPactSlotLevel(playerConfigsClone);
            if (pactSlotLevel > 0) {
                const pactSlotsForEachLevel = getCollection("pactslots");
                const pactSlotsForThisLevel = pactSlotsForEachLevel[pactSlotLevel - 1];
                const maxUses = pactSlotsForThisLevel.pactSlots;
                if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingPactSlots || playerConfigsClone.currentStatus.remainingPactSlots === 0) {
                    pactSlotsRemaining = playerConfigsClone.currentStatus.remainingPactSlots;
                } else {      
                    pactSlotsRemaining = pactSlotsForThisLevel.pactSlots;
                }

                let amountRestored = 1;
                if (menuConfig.featureAction.restoreSpellSlot.amountRestored) {
                    amountRestored = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreSpellSlot.amountRestored.calculation, { userInput: data.userInput, maxUses });
                }
                if (!menuConfig.featureAction.restoreSpellSlot.allowOverMax) {
                    if (pactSlotsRemaining + amountRestored > maxUses) {
                        // only restore to full in this case.
                        amountRestored = maxUses - pactSlotsRemaining;
                    }
                }
                pactSlotsChangeAmount = amountRestored;
            }
            
        } else {
            const slotLevel = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreSpellSlot.slotLevel.calculation, { userInput: data.userInput });
            if (slotLevel && slotLevel > 0) {
                const spellcastingLevel = getSpellcastingLevel(playerConfigs);
                if (spellcastingLevel > 0) {
                    const spellSlotsForEachLevel = getCollection("spellslots");
                    const spellcastingIndex = spellcastingLevel - 1;
                    const allSpellSlotsForThisLevel = spellSlotsForEachLevel[spellcastingIndex];
                    slotLevelPropertyPath = "slotLevel" + slotLevel;
                    const maxUses = allSpellSlotsForThisLevel[slotLevelPropertyPath];
                    if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingSpellSlots && playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                        spellSlotsRemainingForSlotLevel = playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
                    } else {
                        // We have all the slots remaining.
                        spellSlotsRemainingForSlotLevel = maxUses;
                    }

                    let amountRestored = 1;
                    if (menuConfig.featureAction.restoreSpellSlot.amountRestored) {
                        amountRestored = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreSpellSlot.amountRestored.calculation, { userInput: data.userInput, maxUses });
                    }
                    if (!menuConfig.featureAction.restoreSpellSlot.allowOverMax) {
                        if (spellSlotsRemainingForSlotLevel + amountRestored > maxUses) {
                            // only restore to full in this case.
                            amountRestored = maxUses - spellSlotsRemainingForSlotLevel;
                        }
                    }
                    spellSlotChangeAmount = amountRestored;
                }
            }
        }
    }

    // See if there is a restore resource.
    if (menuConfig.featureAction.type.includes("restoreResource")) {
        const resourcePropertyName = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreResource.resourceName.calculation, { userInput: data.userInput });
        const amountRestored = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreResource.amountRestored.calculation, { userInput: data.userInput });

        const dndClass = menuConfig.origin.value;
        const classConfig = playerConfigsClone.classes.find(x => x.name === dndClass.name);
        const resourceToRestore = findResource(playerConfigs, menuConfig.origin.value, menuConfig.origin.type, classConfig, resourcePropertyName);
        if (amountRestored && resourceToRestore && amountRestored > 0) {
            const currentResources = GetRemainingUsesForResource(playerConfigs, resourceToRestore);
            SetRemainingUsesForResource(playerConfigsClone, playerConfigsClone.currentStatus, resourceToRestore, currentResources + amountRestored);
        }
    }

    let cost = 0;
    let atWillUse = true;
    if (menuConfig.featureAction.cost) {
        atWillUse = false;
        cost = performMathCalculation(playerConfigs, menuConfig.featureAction.cost.calculation, { userInput: menuConfig.userInput, resource: menuConfig.resource });
        if (!cost) {
            cost = 0;
        }
    }
    
    let canUseAction
    if (atWillUse) {
        canUseAction = true;

        controlsDisplay.push(<>
            <div className="featureActionResourceDisplay">
                <div className="featureActionConfiguringHorizontal">
                    <div className="featureActionConfiguringVertical">
                        <div>Can use at will.</div>
                    </div>
                </div>
            </div>
        </>);
    } else {
        const oldRemainingUses = menuConfig.resource.remainingUses;
        const newRemainingUses = menuConfig.resource.remainingUses - cost;
        canUseAction = newRemainingUses >= 0 && cost !== 0;

        SetRemainingUsesForResource(playerConfigsClone, playerConfigsClone.currentStatus, menuConfig.resource, newRemainingUses);

        controlsDisplay.push(<>
            <div className="featureActionResourceDisplay">
                <div className="featureActionConfiguringHorizontal">
                    <div className="featureActionConfiguringVertical">
                        <div>{menuConfig.resource.displayName}: {oldRemainingUses} / {menuConfig.resource.maxUses}</div>
                        <div>Cost: {cost}</div>
                        <div>Will Be Remaining: {newRemainingUses}</div>
                    </div>
                </div>
            </div>
        </>);
    }

    if (featureActionUserInput && featureActionUserInput.some(ui => ui.type === "magicBullets")) {
        const magicBulletsInput = featureActionUserInput.find(ui => ui.type === "magicBullets");
        const gunToUseString = menuConfig.userInput[magicBulletsInput.name];
        if (!gunToUseString) {
            canUseAction = false;
        }
    }
    

    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={data} playerConfigs={playerConfigs} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        {controlsDisplay}
        <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(sessionId, playerConfigs, playerConfigsClone, featureActionUserInput, data, spellSlotsRemainingForSlotLevel, spellSlotChangeAmount, pactSlotsRemaining, pactSlotsChangeAmount, slotLevelPropertyPath, menuConfig, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canUseAction || !hasEnoughSpellSlots} buttonSound={(featureActionUserInput && featureActionUserInput.some(ui => ui.type === "magicBullets")) ? "magicgunaudio" : (menuConfig.usingOnSelf ? "healaudio" : "selectionaudio")}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(sessionId, playerConfigs, playerConfigsClone, featureActionUserInput, data, spellSlotsRemainingForSlotLevel, spellSlotChangeAmount, pactSlotsRemaining, pactSlotsChangeAmount, slotLevelPropertyPath, menuConfig, inputChangeHandler, setCenterScreenMenu) {
    if (spellSlotChangeAmount !== 0) {
        // We have any slots for the level we are casting it at.
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

        playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] = spellSlotsRemainingForSlotLevel + spellSlotChangeAmount;
    }

    if (pactSlotsChangeAmount !== 0) {
        playerConfigsClone.currentStatus.remainingPactSlots = pactSlotsRemaining + pactSlotsChangeAmount;
    }

    if (featureActionUserInput && featureActionUserInput.some(ui => ui.type === "magicBullets")) {
        const magicBulletsInput = featureActionUserInput.find(ui => ui.type === "magicBullets");
        const gunToUseString = menuConfig.userInput[magicBulletsInput.name];

        const heldItems = GetHeldItemsWithPlayerItem(playerConfigs.items);
        const gunsWithMagicBullets = heldItems.filter(heldItem => heldItem.dndItem.type === "Weapon" && heldItem.dndItem.tags && heldItem.dndItem.tags.includes("Firearm") && heldItem.playerItem.bullets && heldItem.playerItem.bullets.length && ((heldItem.dndItem.properties && heldItem.dndItem.properties.includes("Bullet-Selection")) ? (heldItem.playerItem.bullets.some(bullet => bullet.type === "focus")) : (heldItem.playerItem.bullets[0].type === "focus")));

        const indexOfDash = gunToUseString.indexOf('-');
        const numberOfGunString = gunToUseString.substring(0, indexOfDash);
        const numberOfGun = parseInt(numberOfGunString);
        const indexOfGun = numberOfGun - 1;
        const selectedGun = gunsWithMagicBullets[indexOfGun];

        const newBullets = [...selectedGun.playerItem.bullets];
        const indexToRemove = newBullets.findIndex(x => x.type === "focus");
        newBullets.splice(indexToRemove, 1);

        deepCloneToMakeChange(playerConfigsClone, selectedGun.pathToItem + ".bullets", newBullets);
    }

    tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
        pushPlayerConfigChanges(playerConfigs, playerConfigsClone, menuConfig, data, inputChangeHandler);
        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    });
}

function pushPlayerConfigChanges(playerConfigs, playerConfigsClone, menuConfig, data, inputChangeHandler) {
    const featureAction = menuConfig.featureAction
    if (featureAction.type.includes("setVariable") && 
        featureAction.setVariable?.variableName?.calculation && 
        featureAction.setVariable?.value?.calculation) {

        const variableName = performMathCalculation(playerConfigs, featureAction.setVariable.variableName.calculation, { userInput: data.userInput });
        const newValue = performMathCalculation(playerConfigs, featureAction.setVariable.value.calculation, { userInput: data.userInput });
        if (variableName && newValue) {
            const oldValue = GetCurrentVariableValue(playerConfigs, menuConfig.origin, variableName);
            if (newValue !== oldValue) {
                SetCurrentVariableValue(playerConfigs, menuConfig.origin, variableName, newValue);
            }
        }
    }

    inputChangeHandler(playerConfigs, "", playerConfigsClone);
}
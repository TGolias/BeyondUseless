import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { getSpellcastingLevel, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { getCollection } from "../../Collections";
import { GetUsesForResource } from "../../SharedFunctions/ResourcesFunctions";

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

    let featureActionUserInput = menuConfig.featureAction.userInput;
    if (menuConfig.featureAction.templateType && menuConfig.featureAction.templateOf && !menuConfig.featureAction.userInput) {
        const templateCollection = getCollection(menuConfig.featureAction.templateType);
        const newFeatureAction = {...templateCollection.find(x => x.name === menuConfig.featureAction.templateOf)};
        featureActionUserInput = newFeatureAction.userInput;
    }

    controlsDisplay.push(<>
        <UserInputsComponent playerConfigs={playerConfigsClone} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} userInputConfig={featureActionUserInput}></UserInputsComponent>
    </>);

    // See if there is a spell slot input.
    let spellSlotsRemainingForSlotLevel = 0
    let spellSlotChangeAmount = 0;
    let slotLevelPropertyPath = undefined;
    let hasEnoughSpellSlots = true;

    const spellSlotConsumtionInput = menuConfig.featureAction.userInput?.find(userInput => userInput.type === "consumeSpellSlot");
    if (spellSlotConsumtionInput) {
        if (!menuConfig.useSpellSlotLevel) {
            menuConfig.useSpellSlotLevel = spellSlotConsumtionInput.minLevel ? performMathCalculation(playerConfigs, spellSlotConsumtionInput.minLevel, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : 1;
        }

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
    
    // See if there is a restore spell slot.
    if (menuConfig.featureAction.type.includes("restoreSpellSlot")) {
        const slotLevel = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreSpellSlot.slotLevel.calculation, { userInput: data.userInput });
        if (slotLevel && slotLevel > 0) {
            const spellcastingLevel = getSpellcastingLevel(playerConfigs);
            if (spellcastingLevel > 0) {
                const spellSlotsForEachLevel = getCollection("spellslots");
                const spellcastingIndex = spellcastingLevel - 1;
                const allSpellSlotsForThisLevel = spellSlotsForEachLevel[spellcastingIndex];
                slotLevelPropertyPath = "slotLevel" + slotLevel;
                if (playerConfigsClone.currentStatus && playerConfigsClone.currentStatus.remainingSpellSlots && playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath] !== undefined) {
                    spellSlotsRemainingForSlotLevel = playerConfigsClone.currentStatus.remainingSpellSlots[slotLevelPropertyPath];
                } else {
                    // We have all the slots remaining.
                    spellSlotsRemainingForSlotLevel = allSpellSlotsForThisLevel[slotLevelPropertyPath];
                }
                spellSlotChangeAmount = 1;
            }
        }
    }

    // See if there is a restore resource.
    if (menuConfig.featureAction.type.includes("restoreResource")) {
        const resourcePropertyName = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreResource.resourceName.calculation, { userInput: data.userInput });
        const amountRestored = performMathCalculation(playerConfigs, menuConfig.featureAction.restoreResource.amountRestored.calculation, { userInput: data.userInput });

        const resourceToRestore = menuConfig.origin.value.resources.find(resource => resource.name === resourcePropertyName);
        if (amountRestored && resourceToRestore && amountRestored > 0) {
            const dndClass = menuConfig.origin.value;
            const classConfig = playerConfigsClone.classes.find(x => x.name === dndClass.name);

            const resourcesForThisLevel = dndClass.resourcesPerLevel[classConfig.levels - 1];
            const maxResourcesForThisLevel = GetUsesForResource(playerConfigs, resourceToRestore, resourcesForThisLevel, classConfig);

            let currentResources = playerConfigsClone.currentStatus.remainingResources[resourcePropertyName];
            if (currentResources === undefined) {
                currentResources = maxResourcesForThisLevel;
            }

            let newAmount = currentResources + amountRestored;
            if (newAmount > maxResourcesForThisLevel) {
                newAmount = maxResourcesForThisLevel;
            }
            playerConfigsClone.currentStatus.remainingResources[resourcePropertyName] = newAmount;
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

        playerConfigsClone.currentStatus.remainingResources[menuConfig.resource.name] = newRemainingUses;

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
    

    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={data} playerConfigs={playerConfigs} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        {controlsDisplay}
        <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(sessionId, playerConfigs, playerConfigsClone, spellSlotsRemainingForSlotLevel, spellSlotChangeAmount, slotLevelPropertyPath, menuConfig, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canUseAction || !hasEnoughSpellSlots} buttonSound={menuConfig.usingOnSelf ? "healaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(sessionId, playerConfigs, playerConfigsClone, spellSlotsRemainingForSlotLevel, spellSlotChangeAmount, slotLevelPropertyPath, menuConfig, inputChangeHandler, setCenterScreenMenu) {
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

    tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
        inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    });
}
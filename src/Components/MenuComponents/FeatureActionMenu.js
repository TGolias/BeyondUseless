import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";

export function FeatureActionMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    if (playerConfigsClone.currentStatus.remainingResources) {
        playerConfigsClone.currentStatus.remainingResources = {...playerConfigsClone.currentStatus.remainingResources}
    } else {
        playerConfigsClone.currentStatus.remainingResources = {};
    }
    
    const data = {};
    data.userInput = menuConfig.userInput;

    const resourceDisplay = [];

    let cost = performMathCalculation(playerConfigs, menuConfig.featureAction.cost.calculation, { userInput: menuConfig.userInput, resource: menuConfig.resource });
    if (!cost) {
        cost = 0;
    }
    const oldRemainingUses = menuConfig.resource.remainingUses;
    const newRemainingUses = menuConfig.resource.remainingUses - cost;
    let canUseAction = newRemainingUses >= 0 && cost !== 0;

    playerConfigsClone.currentStatus.remainingResources[menuConfig.resource.name] = newRemainingUses;

    resourceDisplay.push(<>
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

    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={data} playerConfigs={playerConfigs} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <UserInputsComponent playerConfigs={playerConfigsClone} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UserInputsComponent>
        {resourceDisplay}
        <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canUseAction} buttonSound={menuConfig.usingOnSelf ? "healaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu) {
    tryAddOwnActiveEffectOnSelf(playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
        inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    });
}
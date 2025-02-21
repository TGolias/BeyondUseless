import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { UseOnSelfComponent } from "../SharedComponents/UseOnSelfComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";

export function FeatureActionMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    if (playerConfigsClone.currentStatus.remainingResources) {
        playerConfigsClone.currentStatus.remainingResources = {...playerConfigsClone.currentStatus.remainingResources}
    } else {
        playerConfigsClone.currentStatus.remainingResources = {};
    }
    
    const data = {};
    data.playerConfigs = playerConfigs;
    data.userInput = menuConfig.userInput;

    const middleDisplays = [];
    middleDisplays.push(<>
        <UserInputsComponent playerConfigs={playerConfigsClone} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UserInputsComponent>
    </>);

    let cost = performMathCalculation(playerConfigs, menuConfig.featureAction.cost.calcuation, { userInput: menuConfig.userInput, resource: menuConfig.resource });
    const oldRemainingUses = menuConfig.resource.remainingUses;
    const newRemainingUses = menuConfig.resource.remainingUses - cost;
    let canUseAction = newRemainingUses >= 0 && cost !== 0;

    playerConfigsClone.currentStatus.remainingResources[menuConfig.resource.name] = newRemainingUses;

    middleDisplays.push(<>
        <div className="featureActionResourceDisplay">
            <div className="featureActionConfiguringHorizontal">
                <div className="featureActionConfiguringVertical">
                    <div>{menuConfig.resource.displayName}</div>
                    <div>Current: {oldRemainingUses} / {menuConfig.resource.maxUses}</div>
                    <div>Cost: {cost}</div>
                    <div>Remaining: {newRemainingUses} / {menuConfig.resource.maxUses}</div>
                </div>
            </div>
        </div>
    </>);

    middleDisplays.push(<>
        <UseOnSelfComponent newPlayerConfigs={playerConfigsClone} oldPlayerConfigs={playerConfigs} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler}></UseOnSelfComponent>
    </>);

    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={data} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        {middleDisplays}
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canUseAction} buttonSound={menuConfig.usingOnSelf ? "healaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu) {
    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
}
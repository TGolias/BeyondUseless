import React from "react";
import './ActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { tryAddOwnActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";

export function ActionMenu({sessionId, playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    const userInputRows = [];
    let userInputsAllHaveValues = true;

    const data = {};
    data.userInput = menuConfig.userInput;
    if (menuConfig.action.userInput && menuConfig.action.userInput.length) {
        userInputRows.push(<>
            <div className="centerMenuSeperator"></div>
            <UserInputsComponent playerConfigs={playerConfigs} menuConfig={menuConfig} data={data} menuStateChangeHandler={menuStateChangeHandler} userInputConfig={menuConfig.action.userInput}></UserInputsComponent>
        </>);

        for (const userInput of menuConfig.action.userInput) {
            if (!menuConfig.userInput[userInput.name]) {
                userInputsAllHaveValues = false;
                break;
            }
        }
    }

    return (<>
        <div className="actionMenuWrapperDiv">
            <ActionPageComponent action={menuConfig.action} copyLinkToItem={menuConfig.copyLinkToItem} data={data} playerConfigs={playerConfigs}></ActionPageComponent>
        </div>
        {userInputRows}
        <div className="centerMenuSeperator"></div>
        <div className="actionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(sessionId, playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!userInputsAllHaveValues}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(sessionId, playerConfigs, playerConfigsClone, menuConfig, inputChangeHandler, setCenterScreenMenu) {
    if (menuConfig.action.duration !== "Instantaneous") {
        tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, () => {
            inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
            setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
        });
    } else {
        setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
    }
}
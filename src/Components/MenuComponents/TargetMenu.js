import React from "react";
import './TargetMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { GetAllActiveConnections } from "../../SharedFunctions/LinkedPlayerFunctions";
import { CheckListInput } from "../SimpleComponents/CheckListInput";
import { convertHashMapToArrayOfStrings } from "../../SharedFunctions/Utils";

export function TargetMenu({playerConfigs, menuConfig, menuStateChangeHandler, setCenterScreenMenu}) {
    // We start as a hash map because there'll be multiple strings with the same name.
    const allPossibleTargetsMap = {};
    allPossibleTargetsMap[playerConfigs.name] = true;

    const allActiveConnections = GetAllActiveConnections()
    for (let sessionId of Object.keys(allActiveConnections)) {
        const singleActiveConnection = allActiveConnections[sessionId];
        const sessionPlayerName = singleActiveConnection.remotePlayerConfigs.name;
        allPossibleTargetsMap[sessionPlayerName] = true;
    }

    const allPossibleTargets = convertHashMapToArrayOfStrings(allPossibleTargetsMap);

    return (<>
        <div className="targetMenuContent">
            <div>Are any of the following targeted?</div>
            <CheckListInput baseStateObject={menuConfig} pathToProperty={"targetNames"} inputHandler={menuStateChangeHandler} values={allPossibleTargets}></CheckListInput>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="targetMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })
                menuConfig.onClose(menuConfig.targetNames);
            }} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}
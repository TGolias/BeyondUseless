import React, { useReducer } from "react";
import './SaveMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { createFileNameFromPlayerConfigs, downloadFile } from "../../SharedFunctions/Utils";

export function SaveMenu({playerConfigs, setCenterScreenMenu}) {

    const [, forceUpdate] = useReducer(x => !x, false);

    const saveSlotRows = []
    let saveSlotNumber = 0;
    let saveSlotExists = true;
    let saveSlotToCheck;
    while (saveSlotExists) {
        saveSlotToCheck = getSlotName(saveSlotNumber);
        const saveSlotData = localStorage.getItem(saveSlotToCheck);
        if (saveSlotData) {
            const playerData = JSON.parse(saveSlotData);
            const thisSaveSlotNumber = saveSlotNumber;
            saveSlotRows.push(<>
                <div className="saveMenuSaveSlot">
                    <RetroButton text={"Slot" + thisSaveSlotNumber + ": " + playerData.name} onClickHandler={() => {
                        localStorage.setItem(getSlotName(thisSaveSlotNumber), JSON.stringify(playerConfigs));
                        forceUpdate();
                    }} showTriangle={false} disabled={false}></RetroButton>
                    <RetroButton text="X" onClickHandler={() => RemoveSaveSlot(thisSaveSlotNumber, forceUpdate)} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>);
            saveSlotNumber++;
        } else {
            saveSlotExists = false;
        }
    }

    if (saveSlotRows.length === 0) {
        saveSlotRows.push(<div className="saveMenuNoSaveData">No Save Data</div>)
    }

    return (<>
        <div className="saveMenuButtonsWrapper">
            <RetroButton text="New Slot" onClickHandler={() => {
                localStorage.setItem(saveSlotToCheck, JSON.stringify(playerConfigs));
                forceUpdate();
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Save to File" onClickHandler={() => {
                const fileName = createFileNameFromPlayerConfigs(playerConfigs);
                downloadFile(fileName, playerConfigs);
            }} showTriangle={false} disabled={false}></RetroButton>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="saveMenuSaveSlots">{saveSlotRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="saveMenuButtonsWrapper">
            <RetroButton text="OK" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>)
}

function getSlotName(slotNumber) {
    return "SAVE_SLOT" + slotNumber;
}

function RemoveSaveSlot(slotNumberToRemove, forceUpdate) {
    let slotNumberToCheck = slotNumberToRemove;
    let saveSlotExists = true;
    while (saveSlotExists) {
        const saveSlotToBeOverwritten = getSlotName(slotNumberToCheck);
        const saveSlotToOverwriteWith = getSlotName(slotNumberToCheck + 1);

        const saveDataToOverwriteWith = localStorage.getItem(saveSlotToOverwriteWith);
        if (saveDataToOverwriteWith) {
            localStorage.setItem(saveSlotToBeOverwritten, saveDataToOverwriteWith);
        } else {
            localStorage.removeItem(saveSlotToBeOverwritten);
            saveSlotExists = false;
        }
        slotNumberToCheck++;
    }
    forceUpdate();
}
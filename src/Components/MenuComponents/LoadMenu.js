import React from "react";
import './LoadMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FileUpload } from "../SimpleComponents/FileUpload";
import { playAudio } from "../../SharedFunctions/Utils";

export function LoadMenu({setCenterScreenMenu, addToMenuStack, menuConfig, loadCharacter}) {
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
            const slotText = "Slot" + thisSaveSlotNumber + ": " + playerData.name;
            saveSlotRows.push(<>
                <div className="loadMenuSaveSlot">
                    <RetroButton text={slotText} onClickHandler={() => LoadFromSlot(thisSaveSlotNumber, slotText, menuConfig, addToMenuStack, setCenterScreenMenu, loadCharacter)} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>);
            saveSlotNumber++;
        } else {
            saveSlotExists = false;
        }
    }

    if (saveSlotRows.length === 0) {
        saveSlotRows.push(<div className="loadMenuNoSaveData">No Save Data</div>)
    }

    return (<>
        <div className="loadMenuButtonsWrapper">
            <FileUpload text={"Load from File"} onFileUploaded={(fileData) => {
                try {
                    const newPlayerConfigs = JSON.parse(fileData);
                    loadCharacter(newPlayerConfigs);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                } 
                catch {
                    alert("Unable to Load Character from Uploaded File... Was that a legit save file or did you accidently try to load something else?");
                }
            }}></FileUpload>
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="loadMenuSaveSlots">{saveSlotRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="loadMenuButtonsWrapper">
            <RetroButton text="OK" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>)
}

function getSlotName(slotNumber) {
    return "SAVE_SLOT" + slotNumber;
}

function LoadFromSlot(slotNumberToLoad, slotText, menuConfig, addToMenuStack, setCenterScreenMenu, loadCharacter) {
    setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
        menuTitle: "Load Character", 
        menuText: "Are you sure you would like load\n\n<b>" + slotText + "</b>?", 
        buttons: [
            {
                text: "Confirm",
                onClick: () => {
                    const saveFileString = localStorage.getItem(getSlotName(slotNumberToLoad));
                    const newPlayerConfigs = JSON.parse(saveFileString);
                    loadCharacter(newPlayerConfigs);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            },
            {
                text: "Cancel",
                onClick: () => {
                    addToMenuStack({ menuType: "LoadMenu", menuConfig });
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            }
        ] 
    } });
}
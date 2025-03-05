import React, { useReducer } from "react";
import './LinkedChars.css';
import { RetroButton } from "../SimpleComponents/RetroButton";

export function LinkedChars({setCenterScreenMenu}) {

    const [, forceUpdate] = useReducer(x => !x, false);

    const remoteCharactersString = localStorage.getItem("REMOTE_CHARACTERS");
    const remoteCharacters = JSON.parse(remoteCharactersString);
    const remoteCharactersKeys = Object.keys(remoteCharacters);

    const removeCharactersRows = []
    if (remoteCharactersKeys.length === 0) {
        removeCharactersRows.push(<div className="linkedCharsMenuTitle">No Linked Characters</div>);
    }

    for (let remoteCharacterKey of remoteCharactersKeys) {
        removeCharactersRows.push(<>
            <div className="linkedCharsMenuChar">
                <RetroButton text={remoteCharacterKey} onClickHandler={() => {}} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text="X" onClickHandler={() => {
                    delete remoteCharacters[remoteCharacterKey];
                    localStorage.setItem("REMOTE_CHARACTERS", JSON.stringify(remoteCharacters));
                    forceUpdate();
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </>);
    }

    return (<>
        <div className="linkedCharsMenuChars">{removeCharactersRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="linkedCharsButtonsWrapper">
            <RetroButton text="OK" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>)
}
import React from "react";
import './ConfirmationMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

export function ConfirmationMenu({menuConfig}) {
    const buttons = [];
    for (const buttonConfig of menuConfig.buttons) {
        buttons.push(<>
            <RetroButton text={buttonConfig.text} onClickHandler={buttonConfig.onClick} showTriangle={false} disabled={false} buttonSound={buttonConfig.sound ? buttonConfig.sound : "selectionaudio" }></RetroButton>
        </>);
    }

    const formattedText = parseStringForBoldMarkup(menuConfig.menuText);

    return (<>
        <div className="confirmationMenuWrapperDiv">
            <div className="confirmationMenuText">
                <div>{formattedText}</div>
            </div>
            <div className="centerMenuSeperator"></div>
            <div className="confirmationMenuHorizontal">{buttons}</div>
        </div>
    </>);
}
import React from "react";
import './AspectMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { calculateAddendumAspect, calculateAspectCollection } from "../../SharedFunctions/TabletopMathFunctions";
import { isNumeric, isObject } from "../../SharedFunctions/Utils";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

export function AspectMenu({playerConfigs, menuConfig, setCenterScreenMenu}) {

    // Get aspect value first.
    let finalAspect;
    const aspectCollection = calculateAspectCollection(playerConfigs, menuConfig.aspectName);
    if (Array.isArray(aspectCollection)) {
        finalAspect = "";
        for (let i = 0; i < aspectCollection.length; i++) {
            if (i > 0) {
                if (i === aspectCollection.length - 1) {
                    finalAspect += " and ";
                } else {
                    finalAspect += ", ";
                }
            }
            const singleAspect = aspectCollection[i];
            finalAspect += singleAspect;
        }
    } else if (isObject(aspectCollection)) {
        // I don't actually know lol. Calculation maybe? For now just do this.
        finalAspect = aspectCollection;
    } else {
        finalAspect = aspectCollection;
    }

    if (menuConfig.leadingPlus) {
        if (isNumeric(finalAspect)) {
            finalAspect = (finalAspect < 0 ? "" : "+") + finalAspect;
        } else {
            finalAspect = "+" + finalAspect;
        }
    }

    // Now put any details about it.aspectMenuSmallScreenGrow
    let details = [];
    if (menuConfig.addendumsToShow) {
        for (let addendumToShow of menuConfig.addendumsToShow) {
            const addendumString = calculateAddendumAspect(playerConfigs, addendumToShow);
            if (addendumString) {
                details.push(parseStringForBoldMarkup(addendumString));
            }
        }
    }

    return (<>
        <div className={(details.length === 0 ? "aspectMenuAspectValue aspectMenuSmallScreenGrow" : "aspectMenuAspectValue")}>{finalAspect}</div>
        <div className="centerMenuSeperator" style={{display: (details.length > 0 ? "flex" : "none")}}></div>
        <div className={(details.length > 0 ? "aspectMenuAspectDetails aspectMenuSmallScreenGrow" : "aspectMenuAspectDetails")} style={{display: (details.length > 0 ? "flex" : "none")}}>{details}</div>
        <div className="centerMenuSeperator"></div>
        <div className="aspectMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}
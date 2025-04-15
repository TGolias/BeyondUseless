import React from "react";
import './HomebrewDesign.css';
import { UserInputsComponent } from "../SharedComponents/UserInputsComponent";
import { getCollection } from "../../Collections";
import { ChoiceDesign } from "./ChoiceDesign";

const rightTriangleUnicode = '\u25B6';

export function HomebrewDesign({baseStateObject, inputHandler, homebrewIndex}) {

    const homebrew = getCollection("homebrew");
    const dndHomebrew = homebrew.find(x => x.name === baseStateObject.homebrew[homebrewIndex].name);

    const characterHomebrewCopy = {...baseStateObject.homebrew[homebrewIndex]};
    if (!characterHomebrewCopy.userInput) {
        characterHomebrewCopy.userInput = [];
    }

    const controls = [];

    if (dndHomebrew.userInput) {
        controls.push(<>
            <UserInputsComponent playerConfigs={baseStateObject} userInputConfig={dndHomebrew.userInput} menuConfig={characterHomebrewCopy} menuStateChangeHandler={(bso, ptp, newValue) => {
                inputHandler(baseStateObject, "homebrew[" + homebrewIndex + "]." + ptp, newValue);
            }}></UserInputsComponent>
        </>);
    }

    if (dndHomebrew.features) {
        for (let feature of dndHomebrew.features) {
            controls.push(<>
                <div>{rightTriangleUnicode}{feature.name}</div>
            </>);
        }
    }

    if (dndHomebrew.choices) {
        controls.push(<>
            <ChoiceDesign baseStateObject={baseStateObject} choiceObject={dndHomebrew} pathToPlayerConfigObjectForChoices={"homebrew[" + homebrewIndex + "]"} inputHandler={inputHandler}></ChoiceDesign>
        </>);
    }

    return (<>
        <div className="homebrewDisplayer">
            {controls}
        </div>
    </>)
}
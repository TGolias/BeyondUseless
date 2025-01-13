import React from "react";
import './PointBuyDesign.css'
import { CircleButton } from "../SimpleComponents/CircleButton";
import { calculateStatPointsBought } from "../../SharedFunctions/TabletopMathFunctions";
import { getCapitalizedAbilityScoreName, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function PointBuyDesign({baseStateObject, inputHandler}) {

    const statValueMin = 8;
    const statValueMax = 15;
    const maxPoints = 27;

    const totalPointsBought = calculateStatPointsBought(baseStateObject);

    const statChangers = []
    for (const abilityScoreKey of Object.keys(baseStateObject.abilityScores)) {
        const abilityScoreName = getCapitalizedAbilityScoreName(abilityScoreKey);
        const abilityScoreValue = baseStateObject.abilityScores[abilityScoreKey];

        const pathToProperty = "abilityScores." + abilityScoreKey;
        const amountOfPointsPlusWillIncreaseBy = abilityScoreValue >= 13 ? 2 : 1;

        const disableMinusButton = abilityScoreValue <= statValueMin;
        const disablePlusButton = abilityScoreValue >= statValueMax || (totalPointsBought + amountOfPointsPlusWillIncreaseBy > maxPoints)

        statChangers.push(<>
            <div className="pointBuyNewSection">{abilityScoreName}</div>
            <div className='pointBuyStatChanger'>
                <CircleButton text={"-"} onClickHandler={() => {
                    return onInputChangeHandler(baseStateObject, pathToProperty, abilityScoreValue - 1, inputHandler);
                }} disabled={disableMinusButton}></CircleButton>
                <div className="pointBuyStatValue">{abilityScoreValue}</div>
                <CircleButton text={"+"} onClickHandler={() => {
                    return onInputChangeHandler(baseStateObject, pathToProperty, abilityScoreValue + 1, inputHandler);
                }} disabled={disablePlusButton}></CircleButton>
            </div>
        </>);
    }

    return (<>
        <div className='pointBuyWrapper'>
            <div className='pointBuyLabel'>Base Ability Scores</div>
            <div className='pointBuyIndent'>
                <div className='pointBuyLabel pointBuyNewSection'>{"Point Buy Total: " + totalPointsBought + "/" + maxPoints}</div>
                <>
                    {statChangers}
                </>
            </div>
        </div>
    </>)
}
import React from "react";
import './HeroicInspirationDisplay.css';
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

export function HeroicInspirationDisplay({playerConfigs, inputChangeHandler}) {
    return (<>
        <div className='heroicInspirationOuterbox pixel-corners'>
            <div className="heroicInspirationLabel">Heroic<br></br>Inspiration</div>
            <div className="heroicInspirationContainer">
                <CheckboxInput baseStateObject={playerConfigs} pathToProperty={"currentStatus.heroicInspiration"} inputHandler={inputChangeHandler}></CheckboxInput>
            </div>
        </div>
    </>)
}
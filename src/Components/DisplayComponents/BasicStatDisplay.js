import React from "react";
import './BasicStatDisplay.css';

export function BasicStatDisplay({statValue, children}) {
    return (<>
        <div className='basicOuterbox pixel-corners'>
            <div className="basicBonusLabel">{children}</div>
            <div className="basicScoreContainer">
                <div className='basicScoreModifier'>{statValue}</div>
            </div>
        </div>
    </>)
}
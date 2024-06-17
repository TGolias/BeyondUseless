import React from 'react';
import './StatDisplay.css';
import { calculateModifierForBaseStat } from '../../SharedFunctions/TabletopMathFunctions';

export function StatDisplay({name, value}) {
    const modifierAmount = calculateModifierForBaseStat(value);
    return (
        <>
            <div className='outerbox pixel-corners'>
                <div className="statName">{name}</div>
                <div className='modifier'>{(modifierAmount <= 0 ? "" : "+") + calculateModifierForBaseStat(value)}</div>
                <div className='pixel-corners--wrapper'>
                    <div className='circleAroundScore pixel-corners'>
                        <div className='abilityScore'>{value}</div>
                    </div>
                </div>
            </div>
        </>
    )
}
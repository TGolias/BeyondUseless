import React from 'react';
import { calculateModifierForBaseStat } from '../SharedFunctions/TabletopMathFunctions';
import './StatDisplay.css';

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
import { calculateModifierForBaseStat } from '../SharedFunctions/TabletopMathFunctions';
import './StatDisplay.css';

export function StatDisplay({name, value}) {
    const modifierAmount = calculateModifierForBaseStat(value);
    return (
        <>
            <div className='outerbox'>
                <div>{name}</div>
                <div className='modifier'>{(modifierAmount <= 0 ? "" : "+") + calculateModifierForBaseStat(value)}</div>
                <div className='abilityScore'>{value}</div>
            </div>
        </>
    )
}
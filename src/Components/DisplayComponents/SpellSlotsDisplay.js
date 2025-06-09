import React from 'react';
import './SpellSlotsDisplay.css';
import { getCollection } from '../../Collections';

export function SpellSlotsDisplay({playerConfigs, casterLevel, pactSlotLevel}) {
    const spellSlotRows = [];
    
    // Pact slots first.
    if (pactSlotLevel > 0) {
        const pactSlotsForEachLevel = getCollection("pactslots");
        const pactSlotsForThisLevel = pactSlotsForEachLevel[pactSlotLevel - 1];

        let pactSlotsUsed = 0;
        if (playerConfigs.currentStatus && (playerConfigs.currentStatus.remainingPactSlots || playerConfigs.currentStatus.remainingPactSlots === 0)) {
            const remainingUses = playerConfigs.currentStatus.remainingPactSlots;
            pactSlotsUsed = pactSlotsForThisLevel.pactSlots - remainingUses;
        } 

        let slotUsesString = "";
        for (let j = 0; j < pactSlotsForThisLevel.pactSlots; j++) {
            if (j > 0) {
                slotUsesString += " "
            }

            if (j < pactSlotsUsed) {
                slotUsesString += "X"
            } else {
                slotUsesString += "O"
            }
            
        }

        spellSlotRows.push(<>
            <div className='spellslotsDisplayRow firstCol'>Lvl {pactSlotsForThisLevel.slotLevel} Pact</div>
            <div className='spellslotsDisplayRow lastCol'>{slotUsesString}</div>
        </>);
    }

    // Now just normal spell slots.
    if (casterLevel > 0) {
        const spellSlotsForEachLevel = getCollection("spellslots");
        const spellSlotsForThisLevel = spellSlotsForEachLevel[casterLevel - 1];
        for (let i = 0; i < 10; i++) {
            const slotLevel = i + 1;
            const slotLevelPropertyName = "slotLevel" + slotLevel;
            let spellsForSlotLevel = spellSlotsForThisLevel[slotLevelPropertyName];

            if (spellsForSlotLevel && spellsForSlotLevel > 0) {
                let spellSlotsUsed = 0;
                if (playerConfigs.currentStatus && playerConfigs.currentStatus.remainingSpellSlots && playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyName] !== undefined) {
                    const remainingUses = playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyName];
                    spellSlotsUsed = spellsForSlotLevel - remainingUses;

                    if (remainingUses > spellsForSlotLevel) {
                        spellsForSlotLevel = remainingUses;
                    }
                } 

                let slotUsesString = "";
                for (let j = 0; j < spellsForSlotLevel; j++) {
                    if (j > 0) {
                        slotUsesString += " "
                    }

                    if (j < spellSlotsUsed) {
                        slotUsesString += "X"
                    } else {
                        slotUsesString += "O"
                    }
                    
                }
                spellSlotRows.push(<>
                    <div className='spellslotsDisplayRow firstCol'>Level {slotLevel}</div>
                    <div className='spellslotsDisplayRow lastCol'>{slotUsesString}</div>
                </>);
            }
        }
    }
     
    return (
        <>
            <div className='outerSpellslotsDisplay pixel-corners'>
                <div className='spellslotsDisplayTitle'>Spell Slots</div>
                <div className='spellslotsDisplayGrid'>{spellSlotRows}</div>
            </div>
        </>
    )
}
import { StatDisplay } from "./Components/StatDisplay";
import { calculateHPMax } from "./SharedFunctions/TabletopMathFunctions";
import './Renderer.css';

export function Renderer({playerConfigs}) {
    return (
        <>
            <div>
                <h2>{playerConfigs.name}</h2>
                <div>HP: {calculateHPMax(playerConfigs)}</div>
                <div className="mobileDivider">
                    <div className="baseStats">
                        <StatDisplay name="Strength" value={playerConfigs.baseStats.strength}/>
                        <StatDisplay name="Dexterity" value={playerConfigs.baseStats.dexterity}/>
                        <StatDisplay name="Constitution" value={playerConfigs.baseStats.constitution}/>
                    </div>
                    <div className="baseStats">
                        <StatDisplay name="Intelligence" value={playerConfigs.baseStats.intelligence}/>
                        <StatDisplay name="Wisdom" value={playerConfigs.baseStats.wisdom}/>
                        <StatDisplay name="Charisma" value={playerConfigs.baseStats.charisma}/>
                    </div>
                </div>
            </div>
        </>
    );
}
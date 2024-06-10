import { classes } from './App';
import { SelectList } from './Components/SelectList';
import { TextInput } from './Components/TextInput';
import './Designer.css';

export function Designer({playerConfigs, inputChangeHandler}) {
    return (
        <>
            <div class="fieldHolder">
                <div>
                    <div class="label">Name</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Level</div>
                    <SelectList options={Array.from({length: 20}, (_, i) => i + 1)} baseStateObject={playerConfigs} pathToProperty={"level"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Class</div>
                    <SelectList options={classes.map(x => x.name)} baseStateObject={playerConfigs} pathToProperty={"class"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Strength</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.strength"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Dexterity</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.dexterity"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Constitution</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.constitution"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Intelligence</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.intelligence"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Wisdom</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.wisdom"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div class="label">Charisma</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.charisma"} inputHandler={inputChangeHandler}/>
                </div>
            </div>
        </>
    );
}
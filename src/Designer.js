import { classes } from './App';
import { SelectList } from './Components/SelectList';
import { TextInput } from './Components/TextInput';
import './Designer.css';

export function Designer({playerConfigs, inputChangeHandler}) {
    return (
        <>
            <div>
                <div>
                    <div>Name</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"name"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Class</div>
                    <SelectList options={classes.map(x => x.name)} baseStateObject={playerConfigs} pathToProperty={"class"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Strength</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.strength"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Dexterity</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.dexterity"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Constitution</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.constitution"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Intelligence</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.intelligence"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Wisdom</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.wisdom"} inputHandler={inputChangeHandler}/>
                </div>
                <div>
                    <div>Charisma</div>
                    <TextInput baseStateObject={playerConfigs} pathToProperty={"baseStats.charisma"} inputHandler={inputChangeHandler}/>
                </div>
            </div>
        </>
    );
}
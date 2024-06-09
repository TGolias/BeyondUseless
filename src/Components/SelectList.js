import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { onInputChangeHandler } from "../SharedFunctions/ComponentFunctions";

export function SelectList({options, baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromBaseStateAndPath(baseStateObject, pathToProperty);

    const rows = [];
    if (options) {
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            rows.push(startingValue === option ? <option value={option} selected="selected">{option}</option> : <option value={option}>{option}</option>);
        }
    }
    return <select onInput={(event) => onInputChangeHandler(baseStateObject, pathToProperty, event.target.value, inputHandler)}>{rows}</select>
}
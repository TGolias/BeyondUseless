import React from "react";
import { clearAllCollections } from "./Collections";
import { downloadFileFromString } from "./SharedFunctions/Utils";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Have the next render show the error UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
  }

  render() {
    if (this.state.hasError) {
      return <>
        <div style={{whiteSpace:"pre-wrap", overflowWrap:"break-word"}}>
            <h1>Oh no i died :(</h1>
            <br></br>
            <div>An error has happened.</div>
            <br></br>
            <div>This is almost certainly Tyler's fault...</div>
            <br></br>
            <div>-If you got this error during the initial load or haven't clicked 'UPDATE CONFIG' recently, first you can try <button onClick={() => {
                clearAllCollections();
                window.location.reload();
            }}>clearing the config and reloading by clicking here!!!</button></div>
            <br></br>
            <div>It will clear the cached configuration collections -IT WILL NOT CLEAR YOUR SAVE DATA don't worry- and then it will reload, which may be exactly what you need!</div>
            <br></br>
            <div>But if that doesn't work, try sending the following to Tyler:</div>
            <div>1. The callstack text at the bottom of the page.</div>
            <div>2. The save file that gets downloaded when you <button onClick={() => {
              const date = new Date();
              const fileName = "BeyondUseless_ErrorFile_" + date.toISOString();
              const currentCharacterConfigsJsonString = localStorage.getItem("CURRENT_CHARACTER");
              downloadFileFromString(fileName, currentCharacterConfigsJsonString);
            }}>click this save file link right here!!!</button></div>
            <div>-and yell at him to fix it:</div>
            <br></br>
            <div>Callstack:</div>
            <div>{this.state.error.stack}</div>
        </div>
      </>;
    }

    return this.props.children; 
  }
}
import React from "react";
import { clearAllCollections } from "./Collections";

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
      console.log(this.state.error);
      return <>
        <div style={{whiteSpace:"pre-wrap", overflowWrap:"break-word"}}>
            <h1>Oh no i died :(</h1>
            <br></br>
            <div>An error has happened.</div>
            <br></br>
            <div>This is almost certainly Tyler's fault...</div>
            <br></br>
            <div>-but first you can try <button onClick={async () => {
                await clearAllCollections();
                window.location.reload();
            }}>clicking here!!!</button></div>
            <br></br>
            <div>It will clear the cached configuration collections -IT WILL NOT CLEAR YOUR SAVE DATA don't worry- and then it will reload, which may be exactly what you need!</div>
            <br></br>
            <div>But if that doesn't work, try sending the callstack text below to Tyler, and yell at him to fix it:</div>
            <br></br>
            <div>{this.state.error.stack}</div>
        </div>
      </>;
    }

    return this.props.children; 
  }
}
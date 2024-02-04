import React, { useState } from 'react';
import api from './api'
import logo from './logo.svg';
import './App.css';

function App() {
  const [message, setMessage] = useState('')
  function getWelcome() {
    api.get('/').then((res:any) => {
      console.log(res)
      setMessage(res.data.hello)
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <button onClick={getWelcome}>
          Click me
        </button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React and new things { message }
        </a>
      </header>
    </div>
  );
}

export default App;

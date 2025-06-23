// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css' // Default App.css can be kept or removed if not used

function App() {
  // const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-800 text-white">
      <header className="App-header">
        {/* <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" /> */}
        <h1 className="text-4xl font-bold text-sky-400">
          Vite + React + Tailwind CSS!
        </h1>
        <p className="mt-4 text-lg">
          Frontend setup is in progress. Shadcn UI is next!
        </p>
        {/* <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p> */}
      </header>
    </div>
  )
}

export default App

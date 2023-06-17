import React from 'react';
import './index.css';
import Chat from "./Chat";
import { wrapper } from "@/store/store";

function App() {
    return (
        <div className="App">
            <Chat/>
        </div>
    );
}

export default wrapper.withRedux(App);

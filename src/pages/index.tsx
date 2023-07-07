import React from 'react';
import '../styles/index.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Chat from "../components/Chat";
import {Provider} from "react-redux";
import {wrapper} from "@/store/store";

function App({...rest}) {
    const {store, props} = wrapper.useWrappedStore(rest);

    return (
        <Provider store={store}>
            <div className="App">
                <Chat/>
            </div>
        </Provider>
    );
}

export default App;

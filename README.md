# Sofos

Sofos is a cross-platform desktop application for ChatGPT, implemented with React (TypeScript and Next.js) and Rust (Tauri)

## BUILD the GUI app

After installing [Rust](https://www.rust-lang.org/learn/get-started),
and [Node.js](https://nodejs.org/) just run the following commands in the `root` directory:

Install the `create-tauri-app` utility:

```cargo install create-tauri-app```

Install the Tauri CLI:

```cargo install tauri-cli```

Install node modules:

```npm install```

Build the app to a binary executable file:

```cargo tauri build```

The portable binary executable file of the desktop app will be generated in `src-tauri/target/release/`
The installation file of the desktop app will be generated in `src-tauri/target/release/bundle/`

You can start a live dev session with ```cargo tauri dev```

<br/>

## RUN the React/Next.js App in a browser

Just run the following commands in the `root` directory:

```npm install```

```npm run dev```

Then navigate to http://localhost:3000 in your browser

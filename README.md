# Sofos

Sofos is a cross-platform desktop application for ChatGPT, implemented with React (TypeScript and Next.js) and Rust (Tauri)

## BUILD the GUI app

After installing [Rust](https://www.rust-lang.org/learn/get-started),
and [Node.js](https://nodejs.org/) just run the following commands in the `ferrocrypt-gui` directory:

Install the `create-tauri-app` utility:

```cargo install create-tauri-app```

Install the Tauri CLI:

```cargo install tauri-cli```

Install node modules:

```npm install```

Build the app to a binary executable file:

```cargo tauri build```

The binary executable file of the GUI app will be generated in `ferrocrypt-gui/src-tauri/target/release/bundle/`

You can start a live dev session with ```cargo tauri dev```

<br/>

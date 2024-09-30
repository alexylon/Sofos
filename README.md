# sofos

A multimodal web chatbot developed using Vercel AI SDK, React (TypeScript), Next.js, NextAuth.js and Material UI. It can read messages and analyze multiple images simultaneously. Currently, it responds only with text. 

Supports OpenAI and Anthropic API keys


<br/>

## RUN the React/Next.js App in a browser

### Install Node v.18 or higher

### Copy `.env.local.template` as `.env.local` and fill in the following values:

`OPENAI_API_KEY` - go to https://platform.openai.com/account/api-keys

`ANTHROPIC_API_KEY` - go to https://docs.anthropic.com/en/api/getting-started


`GITHUB_ID` - go to GitHub -> Settings -> Developer Settings -> OAuth Apps -> New OAuth App

`GITHUB_SECRET` - go to GitHub -> Settings -> Developer Settings -> OAuth Apps -> New OAuth App

`NEXTAUTH_SECRET` - generate a random string

Currently, there is no database support.

### Run the following commands in the `root` directory:

```npm install```

```npm run dev```

Then navigate to http://localhost:3000 in your browser

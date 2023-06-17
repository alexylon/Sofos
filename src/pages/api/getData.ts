import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function getCompletion(input: string, temperatureValue: number | number[]) {
    console.log("Number(temperatureValue): ", Number(temperatureValue))
    const openai = new OpenAIApi(configuration);
    return await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": input}],
        temperature: Number(temperatureValue),
    });
}

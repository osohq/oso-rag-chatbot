import OpenAI from "openai";
import debug from "debug";

const llmDebug = new debug('llm');
const embeddingDebug = new debug('embedding');
const openai = new OpenAI();

// Generate a vector embedding from the submitted prompt
export async function generateEmbedding(prompt) {
  const embeddingsModel = 'text-embedding-3-large'
  llmDebug(`Model: ${embeddingsModel}`);
  llmDebug(`Prompt: ${prompt}`);

  // This is the call to the openAI model that generates the embedding
  const embedding = await openai.embeddings.create({
    model: embeddingsModel,
    input: prompt,
  }).then(response =>
    // extract the embedding from the JSON response
    response["data"][0]["embedding"]
  );

  embeddingDebug('Embedding:');
  embeddingDebug(embedding);

  return embedding 
}

// Use the gpt-4o-mini model to generate an LLM response
// based on the prompt and any additional context obtained via RAG
export async function generateChatbotResponse(prompt, context){
  const completionsModel = 'gpt-4o-mini'

  // The developer prompt to the chatbot tells it how to behave,
  // provides information about the data it's receiving,
  // and supplies the RAG context (if any)
  const developerPrompt = `
    You are a very enthusiastic HR representative who loves
    to help people!

    Given the following sections from the company 
    handbook and internal documents, answer the question using
    that information as the primary source.
    
    You can supplement the information in the context sections
    with general information that you know, but be sure to distinguish
    internal information from external information in your response.

    If you are unsure and the answer is not explicitly written
    in the information you have, say
    "Sorry, I don't know how to help with that."

    Context sections:
    ${context}

    Answer in conversational prose.
`

  llmDebug(`Model: ${completionsModel}`);
  llmDebug(`Prompt: ${prompt}`);

  // This is the call to the openAI model that generates the chatbot response
  const response = await openai.chat.completions.create({
    model: completionsModel,
    messages: [
      { role: "developer", content: developerPrompt },
      { role: "user", content: prompt },  // the user prompt is the question that the user asked
    ],
    store: true,
  });

  llmDebug("Response:");
  llmDebug(response);
  return `${response.choices[0].message.content}\n`;
}

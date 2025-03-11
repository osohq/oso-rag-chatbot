import debug from 'debug';

// local imports
import { getAuthorizationFilter } from './authz.js';
import { getAuthorizedBlocks } from './data.js';
import { generateEmbedding, generateChatbotResponse } from './llm.js';

const mainDebug = new debug('main');

export async function handlePrompt(user, prompt, threshold=0.3) {
  // Step 2: Convert the user's prompt to an embedding
  const promptEmbedding = await generateEmbedding(prompt)

  // Step 3: Get an authorization filter from Oso Cloud
  const authorizationFilter = await getAuthorizationFilter(user);

  // Step 4: Get the authorized context
  //         from the embeddings database
  const authorizedBlocks = await getAuthorizedBlocks(promptEmbedding, authorizationFilter, threshold);

  // Write the authorized blocks and their similarity scores to debug logs
  mainDebug("I'll send the following additional context:");
  authorizedBlocks.map(block => {
    mainDebug(`(Similarity: ${block.similarity.toPrecision(3)}) ${block.content}`);
  });

  // Convert the block text to a single string
  // to be passed to the LLM as context
  const context = authorizedBlocks.map( block => block.content ).join("");

  // Send the prompt and context to the chatbot
  const response = await generateChatbotResponse(prompt, context);

  //Step 6: Display the response
  console.log(response);
}

// Listen for questions
//await createCli(handlePrompt);
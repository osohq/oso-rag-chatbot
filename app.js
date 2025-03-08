import debug from 'debug';

// local imports
import { getAuthorizationFilter } from './authz.js';
import { getAuthorizedBlocks } from './data.js';
import { generateEmbedding, generateChatbotResponse } from './llm.js';

const mainDebug = new debug('main');

export async function handlePrompt(user, prompt, threshold=0.3) {
  // convert the user's prompt to a vector using
  // the llm that we used to generate the context embeddings
  const promptEmbedding = await generateEmbedding(prompt)

  // Get an authorization filter from Oso Cloud
  const authorizationFilter = await getAuthorizationFilter(user);

  // Use the authorization filter and the prompt embedding
  // to get the list of related blocks (based on threshold)
  // that this user is allowed to use
  const authorizedBlocks = await getAuthorizedBlocks(promptEmbedding, authorizationFilter, threshold);

  // Write the authorized blocks and their similarity scores to debug logs
  mainDebug("I'll send the following additional context:");
  authorizedBlocks.map(block => {
    mainDebug(`(Similarity: ${block.similarity.toPrecision(3)}) ${block.content}`);
  });

  // Convert the block text to a single string
  // to be passed to the LLM as context
  const context = authorizedBlocks.map( block => block.content ).join("");

  // Send the prompt and context to the chatbot and display the response
  const response = await generateChatbotResponse(prompt, context);
  console.log(response);
}

// Listen for questions
//await createCli(handlePrompt);
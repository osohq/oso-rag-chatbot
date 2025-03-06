import { Prisma } from '@prisma/client'
import pino from 'pino';

import { oso, openai, prisma, addFacts, insertBlocks } from './data.js';
import { createCli } from './cli.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function handlePrompt(user, prompt, threshold=0.3) {
  // convert the user's prompt to a vector using
  // the llm that we used to generate the context embeddings
  const promptEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: prompt,
  }).then(response =>
    response["data"][0]["embedding"]
  );

  // Generate a filter from the externalized authorization logic
  const authorizationFilter = await oso.listLocal(
    { type: "User", id: user },
    "view",
    "Block",
    "id"
  );

  logger.debug(authorizationFilter);

  // Use the filter to determine the complete list of blocks this user is allowed to use
  const blockIds = await prisma.$queryRawUnsafe(
    `SELECT id FROM block WHERE ${authorizationFilter}`
  ).then( rows =>
    rows.map( row => Prisma.sql`${row.id}::integer` )
  )

  logger.debug("Authorized blocks query:");
  logger.debug(`SELECT
      id,
      document_id,
      content,
      1 - (embedding::vector <=> ${promptEmbedding}::vector) as similarity
    FROM block 
    WHERE id IN (${Prisma.join(blockIds)})
    AND (1 - (embedding::vector <=> ${promptEmbedding}::vector)) > ${threshold}`);

  // Restrict the similarity search to blocks this user is allowed to view
  const authorizedBlocks =
    await prisma.$queryRaw`SELECT
        id,
        document_id,
        content,
        1 - (embedding::vector <=> ${promptEmbedding}::vector) as similarity
      FROM block 
      WHERE id IN (${Prisma.join(blockIds)})
      AND (1 - (embedding::vector <=> ${promptEmbedding}::vector)) > ${threshold}`;

  console.log();
  console.log("I'll send the following additional context:");

  // return the authorized blocks and their similarity scores
  authorizedBlocks.map(block => {
    console.log(`(Similarity: ${block.similarity.toPrecision(3)}) ${block.content}`);
  })
}

// Insert some sample text with embeddings.
await insertBlocks();

// Add some facts
await addFacts();

// Listen for questions
await createCli(handlePrompt);
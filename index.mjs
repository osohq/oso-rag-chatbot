import { Prisma } from '@prisma/client'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { oso, openai, prisma, addFacts, insertBlocks } from './data.mjs';

const rl = readline.createInterface({ input, output });

async function handlePrompt(user, prompt) {
  const promptEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: prompt,
  }).then(response =>
    response["data"][0]["embedding"]
  );

  const authorizationFilter = await oso.listLocal(
    { type: "User", id: user },
    "view",
    "Block",
    "id"
  );

  const blockIds = await prisma.$queryRawUnsafe(
    `SELECT id FROM block WHERE ${authorizationFilter}`
  ).then( rows =>
    rows.map( row => Prisma.sql`${row.id}::integer` )
  )
  
  if ( blockIds.length === 0 ){
    console.log(`I won't send any additional context.`)
    return
  } 

  const authorizedBlocks =
    await prisma.$queryRaw`SELECT id, document_id, content, 1 - (embedding::vector <=> ${promptEmbedding}::vector) as similarity FROM block WHERE id IN (${Prisma.join(blockIds)}) AND (1 - (embedding::vector <=> ${promptEmbedding}::vector)) > 0.3`;

  console.log();
  console.log("I'll send the following additional context:");

  authorizedBlocks.map(block => {
    console.log(`(Similarity: ${block.similarity.toPrecision(3)}) ${block.content}`);
  })
}

// Insert some sample text with embeddings.
await insertBlocks();

// Add some facts
await addFacts();

async function promptUser() {
  try {
    console.log();

    const user = (await rl.question('Who are you? ')).toLowerCase();
    if (user === 'exit') {
      rl.close();
      return;
    }
    const userCapitalized = user.charAt(0).toUpperCase() + user.slice(1);

    const prompt = await rl.question(`Hi, ${userCapitalized}! What would you like to ask? `);
    if (prompt.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    await handlePrompt(user, prompt);
    console.log();

    await promptUser();
  } finally {
    await prisma.$disconnect()
  };
}
  
await promptUser();
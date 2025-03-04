import OpenAI from "openai";
import { Prisma } from '@prisma/client'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { oso, prisma, addFacts, insertBlocks } from './data.mjs';

const openai = new OpenAI();
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
    await prisma.$queryRaw`SELECT id, document_id, content, 1 - (embedding::vector <=> ${promptEmbedding}::vector) as similarity FROM block WHERE id IN (${Prisma.join(blockIds)})`;

  console.log("I'll send the follwoing additional context:");

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
    const user = await rl.question('Who are you? ');
    if (user.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    const prompt = await rl.question(`Hi, ${user}! What would you like to ask? `);
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
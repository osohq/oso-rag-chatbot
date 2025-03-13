import { Prisma, PrismaClient } from "@prisma/client";
import debug from "debug";
import { generateEmbedding } from "./llm.js";

const dataDebug = new debug('data');

export const prisma = new PrismaClient()

// Get the blocks from the database that pass the authorization filter
export async function getAuthorizedBlocks(promptEmbedding, authorizationFilter, threshold){
  // Get the ids of the blocks that this user is allowed to view
  const blockIdRows = await prisma.$queryRawUnsafe(
    `SELECT id FROM block WHERE ${authorizationFilter}`
  );
 
  // Convert the block ids to a comma-delimited string
  // just used for debug logging
  const blockIdsString = blockIdRows.map( row => row.id).join(',');

  // Convert the blockIds to a Prisma type that can be appended to the similarity search
  const blockIds = blockIdRows.map( row => Prisma.sql`${row.id}::integer` )

  dataDebug("Authorized similarity search:");
  dataDebug(`SELECT
      id,
      document_id,
      content,
      1 - (embedding::vector <=> promptEmbedding::vector) as similarity
    FROM block 
    WHERE id IN ([${blockIdsString}])
    AND (1 - (embedding::vector <=> promptEmbedding::vector)) > ${threshold}`);

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

  return authorizedBlocks
}

// ****************************************************************
// Initialization functions
// ****************************************************************

export async function addVectorEmbeddings(){
  const blocks = await prisma.block.findMany()

  for (const block of blocks){
    dataDebug(`content: ${block.content}`);
    const embedding = await generateEmbedding(block.content);
    dataDebug("embedding:");
    dataDebug(embedding);

    await prisma.$executeRaw`
      UPDATE block
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${block.id}
    `;
  }  
}
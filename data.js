import { Prisma, PrismaClient } from "@prisma/client";
import debug from "debug";
import { generateEmbedding } from "./llm.js";
import blocks from "./data/blocks.json" with { type: "json" };
import documents from "./data/documents.json" with { type: "json" };
import folders from "./data/folders.json" with { type: "json" };
import teams from "./data/teams.json" with { type: "json" };

const dataDebug = new debug('data');

export const prisma = new PrismaClient()

// Get the blocks from the database that pass the authorization filter
export async function getAuthorizedBlocks(promptEmbedding, authorizationFilter, threshold){
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

// Delete data from all tables before reinitializing
export async function deleteAllData(){
    await prisma.$executeRaw`DELETE FROM block`;
    await prisma.$executeRaw`DELETE FROM document`;
    await prisma.$executeRaw`DELETE FROM folder`;
    await prisma.$executeRaw`DELETE FROM team`;
}

// Populate the teams table with data from /data/folders.json
export async function insertTeams() {
  // Only initialize empty tables
  if (await prisma.team.count() > 0){
    return;
  }

  for (const team of teams){
    await prisma.$executeRaw`INSERT INTO team (name)
                             VALUES (${team.name})`;
  }
}

// Populate the folders table with data from /data/folders.json
export async function insertFolders() {
  // Only initialize empty tables
  if (await prisma.folder.count() > 0){
    return;
  }

  for (const folder of folders){
    await prisma.$executeRaw`INSERT INTO folder (team_id, name, is_public)
                             VALUES (${folder.team_id},
                                     ${folder.name},
                                     ${folder.is_public}
                                     )`;
  };
}

// Populate the documents table with data from /data/folders.json
export async function insertDocuments() {
  // Only initialize empty tables
  if (await prisma.document.count() > 0){
    return;
  }

  for (const document of documents){
    await prisma.$executeRaw`INSERT INTO document (folder_id, title)
                             VALUES (${document.folder_id},
                                     ${document.title}
                                     )`;
  };
}

// Populate the blocks table with data from /data/blocks.json
export async function insertBlocks() {
  const blockCount = await prisma.block.count();
  if (blockCount > 0){
    return;
  }

  for (const block of blocks){
    const embedding = await generateEmbedding(block.content);

    await prisma.$executeRaw`INSERT INTO block (document_id, content, embedding)
                             VALUES (${block.document_id},
                                     ${block.content},
                                     ${JSON.stringify(embedding)}::vector)`;
  };
}

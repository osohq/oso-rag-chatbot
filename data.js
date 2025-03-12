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

export async function initializeDatabase(){
  dataDebug("Initiailizing database...");

  await addVectorExtension();
  await rebuildTables();
  await loadData();

  dataDebug("Database is initialized.");
}

async function addVectorExtension(){
  dataDebug("Enabling vector extension...");
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions`;
}

async function rebuildTables(){
  // Drop all existing tables
  dataDebug("Dropping tables...");
  await prisma.$executeRaw`DROP TABLE IF EXISTS block`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS document`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS folder`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS team`;
 
  // recreate the "team" table
  dataDebug("Creating 'team' table...");
  await prisma.$executeRaw`
    create table
      public.team (
        id serial not null,
        name text not null,
        constraint team_pkey primary key (id)
      ) tablespace pg_default;  
  `;
  
  // recreate the "folder" table
  dataDebug("Creating 'folder' table...");
  await prisma.$executeRaw`
    create table
      public.folder (
        id serial not null,
        team_id integer null,
        name text not null,
        is_public boolean not null,
        constraint folder_pkey primary key (id),
        constraint folder_team_id_fkey foreign key (team_id) references team (id)
      ) tablespace pg_default;
  `;

  // recreate the "document" table
  dataDebug("Creating 'document' table...");
  await prisma.$executeRaw`
    create table
      public.document (
        id serial not null,
        folder_id integer null,
        title text not null,
        constraint document_pkey primary key (id),
        constraint document_folder_id_fkey foreign key (folder_id) references folder (id)
      ) tablespace pg_default;
  `;

  // recreate the "block" table
  dataDebug("Creating 'block' table...");
  await prisma.$executeRaw`
    create table
      public.block (
        id serial not null,
        document_id integer null,
        content text not null,
        embedding extensions.vector null,
        constraint block_pkey primary key (id),
        constraint block_document_id_fkey foreign key (document_id) references document (id)
      ) tablespace pg_default;
  `;
}

// Load all the demo data
async function loadData(){
  dataDebug("Loading data...");
  await insertTeams();
  await insertFolders();
  await insertDocuments();
  await insertBlocks();
}

// Populate the teams table with data from /data/folders.json
async function insertTeams() {
  dataDebug("Loading 'team' table...");

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
async function insertFolders() {
  dataDebug("Loading 'folders' table...");

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
async function insertDocuments() {
  dataDebug("Loading 'documents' table...");

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
async function insertBlocks() {
  dataDebug("Loading 'blocks' table...");

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

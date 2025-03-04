import { Oso } from "oso-cloud"
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient()

export const oso = new Oso(
  process.env.OSO_URL,
  process.env.OSO_AUTH,
  { dataBindings: "authorization/data.yaml" }
);

export async function addFacts(){
  await oso.insert([
    "has_role",
    {type: "User", id: "diane"},
    "hr"
  ]);

  await oso.insert([
    "has_role",
    {type: "User", id: "diane"},
    "member",
    {type: "Team", id: "1"}
  ]);

  await oso.insert([
    "has_role",
    {type: "User", id: "bob"},
    "member",
    {type: "Team", id: "2"}
  ]);

  await oso.insert([
    "has_relation",
    {type: "Folder", id: "1"},
    "team",
    {type: "Team", id: "1"}
  ]);

  await oso.insert([
    "has_relation",
    {type: "Folder", id: "2"},
    "team",
    {type: "Team", id: "2"}
  ]);
}

export async function insertBlocks() {
  const blockCount = await prisma.block.count();
  if (blockCount > 0){
    return;
  }

  const block1 = "Alice says that Bob is horrible to work with."
  const embedding1 = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: block1,
  }).then(response =>
    response["data"][0]["embedding"]
  );

  const block2 = "Bob should seek opportunities to improve his collaboration."
  const embedding2 = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: block2,
  }).then(response =>
    response["data"][0]["embedding"]
  );

  // insert the text and embeddings
  await prisma.$executeRaw`INSERT INTO block (document_id, content, embedding) VALUES (1, ${block1}, ${JSON.stringify(embedding1)}::vector)`;
  await prisma.$executeRaw`INSERT INTO block (document_id, content, embedding) VALUES (1, ${block2}, ${JSON.stringify(embedding2)}::vector)`;
}

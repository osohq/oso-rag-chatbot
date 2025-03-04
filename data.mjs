import { Oso } from "oso-cloud";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import blocks from "./data/blocks.json" with { type: "json" };
import facts from "./data/facts.json" with { type: "json" };

export const prisma = new PrismaClient()
export const openai = new OpenAI();

export const oso = new Oso(
  process.env.OSO_URL,
  process.env.OSO_AUTH,
  { dataBindings: "authorization/data.yaml" }
);

export async function addFacts(){
  for (const fact of facts) {
    await oso.insert(fact)
  }
}

export async function insertBlocks() {
  const blockCount = await prisma.block.count();
  if (blockCount > 0){
    return;
  }

  for (const block of blocks){
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: block.content,
    }).then(response =>
      response["data"][0]["embedding"]
    );

    await prisma.$executeRaw`INSERT INTO block (document_id, content, embedding) VALUES (${block.document_id}, ${block.content}, ${JSON.stringify(embedding)}::vector)`;
  };
}

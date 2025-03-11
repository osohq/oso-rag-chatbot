import { Oso } from "oso-cloud";
import debug from "debug";
import fs from "fs";
import facts from "./data/facts.json" with { type: "json" };

const authzDebug = new debug('authz');

// default to using the local dev server
// if environment variables aren't set
export const oso = new Oso(
  process.env.OSO_URL || "http://localhost:8080",
  process.env.OSO_AUTH || "e_0123456789_12345_osotesttoken01xiIn",
  { dataBindings: "authorization/data.yaml" }
);

// Generate the list of blocks that the user can view
// based on the externalized authorization logic
export async function getAuthorizationFilter(user) {
  const authorizationFilter = await oso.listLocal(
    { type: "User", id: user },
    "view",
    "Block",
    "id"
  );

  // Write the authorization query to debug logs
  authzDebug("Authorization filter query from Oso:")
  authzDebug(authorizationFilter);

  return authorizationFilter
}

// ****************************************************************
// Initialization functions
// ****************************************************************

export async function initializeOso(){
  authzDebug("Initializing Oso...");

  await loadPolicy();
  await addFacts();

  authzDebug("Oso is initialized.");
}

async function loadPolicy(){
  authzDebug("Loading policy...");

  const policy = fs.readFileSync('./authorization/policy.polar',
    { encoding: 'utf8', flag: 'r' }); 

  await oso.policy(policy);

  authzDebug("Loaded policy:");
  authzDebug(await oso.getPolicyMetadata());
}

// Populate Oso environment with facts from ./data/facts.json
async function addFacts(){
  authzDebug("Adding facts...");

  for (const fact of facts) {
    authzDebug(`Adding fact: ${fact[0].toString()}`);
    await oso.insert(fact);
  }
}

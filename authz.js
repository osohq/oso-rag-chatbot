import { Oso } from "oso-cloud";
import debug from "debug";
import facts from "./data/facts.json" with { type: "json" };

const authzDebug = new debug('authz');

export const oso = new Oso(
  process.env.OSO_URL,
  process.env.OSO_AUTH,
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

// Populate Oso environment with facts from ./data/facts.json
export async function addFacts(){
  for (const fact of facts) {
    authzDebug(`Adding fact: ${fact}`);
    await oso.insert(fact);
  }
}

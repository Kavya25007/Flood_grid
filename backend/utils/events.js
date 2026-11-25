// Azure Cosmos DB: activity events as JSON documents (semi-structured data, DP-900)
const crypto = require('crypto');
const { CosmosClient } = require('@azure/cosmos');

let containerPromise = null;

function enabled() {
  return !!(process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY);
}

function container() {
  if (!containerPromise) {
    const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
    containerPromise = client.databases
      .createIfNotExists({ id: process.env.COSMOS_DB || 'floodgrid' })
      .then(({ database }) =>
        database.containers.createIfNotExists({
          id: process.env.COSMOS_CONTAINER || 'events',
          partitionKey: { paths: ['/userId'] },
        })
      )
      .then(({ container: c }) => c)
      .catch((e) => {
        containerPromise = null;
        throw e;
      });
  }
  return containerPromise;
}

// Fire and forget: a Cosmos problem must never break the main request
async function logEvent(userId, type, data) {
  if (!enabled()) return;
  try {
    const c = await container();
    await c.items.create({
      id: crypto.randomUUID(),
      userId: String(userId == null ? 'system' : userId),
      type,
      data: data || {},
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Cosmos event failed:', err.message);
  }
}

module.exports = { enabled, logEvent };

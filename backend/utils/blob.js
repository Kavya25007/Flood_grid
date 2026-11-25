// Azure Blob Storage: delivery proof photos (unstructured data, DP-900)
const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');

const CONTAINER = process.env.BLOB_CONTAINER || 'proofs';
let containerPromise = null;

function enabled() {
  return !!process.env.AZURE_STORAGE_CONNECTION_STRING;
}

function container() {
  if (!containerPromise) {
    const svc = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const c = svc.getContainerClient(CONTAINER);
    containerPromise = c.createIfNotExists().then(() => c).catch((e) => {
      containerPromise = null;
      throw e;
    });
  }
  return containerPromise;
}

async function uploadProof(buffer, contentType, requestId) {
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const name = `request-${requestId}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const c = await container();
  await c.getBlockBlobClient(name).uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
  return name;
}

async function downloadProof(name) {
  const c = await container();
  return c.getBlobClient(name).download();
}

module.exports = { enabled, uploadProof, downloadProof };

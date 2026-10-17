import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'document-jobs';
const localRoot = path.resolve(process.env.LOCAL_STORAGE_PATH || 'data');

let containerPromise;

async function getContainer() {
  if (!connectionString && !accountUrl) return null;
  if (!containerPromise) {
    containerPromise = (async () => {
      const service = connectionString
        ? BlobServiceClient.fromConnectionString(connectionString)
        : new BlobServiceClient(accountUrl, new DefaultAzureCredential());
      const container = service.getContainerClient(containerName);
      await container.createIfNotExists();
      return container;
    })();
  }
  return containerPromise;
}

export async function putObject(key, data, contentType = 'application/octet-stream') {
  const container = await getContainer();
  if (container) {
    await container.getBlockBlobClient(key).uploadData(data, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return;
  }

  const target = path.join(localRoot, ...key.split('/'));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getObject(key) {
  const container = await getContainer();
  if (container) return container.getBlockBlobClient(key).downloadToBuffer();
  return readFile(path.join(localRoot, ...key.split('/')));
}

export async function putJson(key, value) {
  await putObject(key, Buffer.from(JSON.stringify(value, null, 2)), 'application/json');
}

export async function getJson(key) {
  return JSON.parse((await getObject(key)).toString('utf8'));
}

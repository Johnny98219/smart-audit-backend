const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const defaultCacheDuration = 3600 * 1000; // Default expiry time in milliseconds (1 hour)

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function readCache(filename, time = false) {
  try {
    const data = await fs.readFile(filename, 'utf8');
    const parsedData = JSON.parse(data);
    if (time) {
      return parsedData;
    } else {
      return parsedData.data;
    }
  } catch {
    return null;
  }
}

async function writeCache(filename, data) {
  try {
    const dir = path.dirname(filename);
    await fs.mkdir(dir, { recursive: true });

    const isString = typeof data === 'string';

    const cacheContent = {
      time: new Date().getTime(),
      data: isString ? JSON.parse(data) : data,
    };

    await fs.writeFile(filename, JSON.stringify(cacheContent), 'utf8');
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

async function apiRequestWithRetry(url, params, retryCount = 3) {
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error making the request:', error);
    }
  }
  return null;
}

async function fetchCache(
  filename,
  endpoint,
  retries,
  cacheDuration = defaultCacheDuration
) {
  let cachedData = await readCache(filename, true);
  if (
    cachedData &&
    new Date().getTime() - cachedData.time <= cacheDuration * 1000
  ) {
    console.log(`Fetching ${filename} from cache.`);
    return cachedData.data;
  }

  console.log(`Making request to ${endpoint}.`);
  const requestParams = {
    /* ... */
  }; // Customize based on the endpoint
  const responseData = await apiRequestWithRetry(
    endpoint,
    requestParams,
    retries
  );

  if (!responseData) return null;

  await writeCache(filename, responseData);
  return responseData;
}

async function getCached(
  cacheFilename,
  dataFunction,
  cacheDuration = defaultCacheDuration,
  ...dataArgs
) {
  let cachedData = await readCache(cacheFilename, true);
  if (
    cachedData &&
    new Date().getTime() - cachedData.time <= cacheDuration * 1000
  ) {
    console.log(`Fetching ${cacheFilename} from cache.`);
    return cachedData.data;
  }

  try {
    let freshData = await dataFunction(...dataArgs);
    await writeCache(cacheFilename, freshData);
    return freshData;
  } catch (error) {
    console.error('Error fetching fresh data:', error);
    return null;
  }
}

module.exports = {
  fileExists,
  readCache,
  writeCache,
  fetchCache,
  getCached,
};

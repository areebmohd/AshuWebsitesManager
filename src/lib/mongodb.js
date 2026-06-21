import { MongoClient } from 'mongodb';
import dns from 'dns';

const uri = process.env.MONGODB_URI;
const options = {};

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// Custom manual resolver to bypass c-ares DNS resolveSrv bugs on Windows/local networks
async function getResolvedClient() {
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel || !uri.startsWith('mongodb+srv://')) {
    const client = new MongoClient(uri, options);
    return client.connect();
  }

  return new Promise((resolve, reject) => {
    const match = uri.match(/^mongodb\+srv:\/\/([^@]+@)?([^/?#]+)([^#]*)$/);
    if (!match) {
      const client = new MongoClient(uri, options);
      return client.connect().then(resolve).catch(reject);
    }

    const auth = match[1] || '';
    const srvHost = match[2];
    const rest = match[3] || '';

    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    resolver.resolveSrv(`_mongodb._tcp.${srvHost}`, (srvErr, addresses) => {
      if (srvErr) {
        console.warn('Custom SRV lookup failed, falling back to standard driver resolution:', srvErr);
        const client = new MongoClient(uri, options);
        return client.connect().then(resolve).catch(reject);
      }

      resolver.resolveTxt(srvHost, (txtErr, records) => {
        const txtOptions = !txtErr && records && records.length > 0
          ? records[0].join('&')
          : '';

        const hostsList = addresses.map(addr => `${addr.name}:${addr.port}`).join(',');

        let path = '';
        let queryStr = '';
        const pathMatch = rest.match(/^([^?]*)\??(.*)$/);
        if (pathMatch) {
          path = pathMatch[1] || '/';
          queryStr = pathMatch[2] || '';
        }

        const allOptionsList = [];
        if (txtOptions) allOptionsList.push(txtOptions);
        if (queryStr) allOptionsList.push(queryStr);
        if (!allOptionsList.some(o => o.includes('ssl='))) {
          allOptionsList.push('ssl=true');
        }

        const mergedQuery = allOptionsList.length > 0 ? `?${allOptionsList.join('&')}` : '';
        const resolvedUri = `mongodb://${auth}${hostsList}${path}${mergedQuery}`;

        const client = new MongoClient(resolvedUri, options);
        client.connect().then(resolve).catch(reject);
      });
    });
  });
}

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = getResolvedClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, connect lazily using a Thenable to avoid connection attempts at build/import time.
  clientPromise = {
    then: function(onFulfilled, onRejected) {
      if (!global._mongoClientPromiseProd) {
        global._mongoClientPromiseProd = getResolvedClient();
      }
      return global._mongoClientPromiseProd.then(onFulfilled, onRejected);
    }
  };
}

export default clientPromise;

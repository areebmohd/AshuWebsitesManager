import { MongoClient } from 'mongodb';
import dns from 'dns';

// Prepend public DNS resolvers to handle SRV lookups on local systems
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
} catch (e) {
  console.warn("Could not set DNS fallback inside mongodb client:", e);
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, connect lazily using a Thenable to avoid connection attempts at build/import time.
  clientPromise = {
    then: function(onFulfilled, onRejected) {
      if (!global._mongoClientPromiseProd) {
        client = new MongoClient(uri, options);
        global._mongoClientPromiseProd = client.connect();
      }
      return global._mongoClientPromiseProd.then(onFulfilled, onRejected);
    }
  };
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

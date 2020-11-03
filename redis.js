const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('./keys')

const client = redis.createClient(keys.REDIS_URL);
client.hget = util.promisify(client.hget);

// create reference for .exec
const exec = mongoose.Query.prototype.exec;

// create new cache function on prototype
mongoose.Query.prototype.cache = function(options = { expire: 60 }) {
    console.log(14,options);
  this.useCache = true;
  this.expire = options.expire;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);
console.log(18,this.hashKey);
  return this;
}

// override exec function to first check cache for data
mongoose.Query.prototype.exec = async function() {
    console.log(24, arguments);
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name
  });
  console.log(33,key);

  // get cached value from redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if cache value is not found, fetch data from mongodb and cache it
  if (!cacheValue) {
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, this.expire);

    console.log('Return data from MongoDB', result);
    return result;
  }

  // return found cachedValue
  console.log(49,cacheValue); 
  const doc = JSON.parse(cacheValue);
  console.log('Return data from Redis', cacheValue);
  return Array.isArray(doc)
    ? doc.map(d => new this.model(d))
    : new this.model(doc);
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
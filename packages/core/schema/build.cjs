const fs = require('fs')
const path = require('path')
const Hyperschema = require('hyperschema')
const HyperDB = require('hyperdb/builder')

const SCHEMA_DIR = path.join(__dirname, 'spec/hyperschema')
const DB_DIR = path.join(__dirname, 'spec/hyperdb')

const schema = Hyperschema.from(SCHEMA_DIR)
const ns = schema.namespace('altersend')

ns.register({
  name: 'remembered-peer',
  fields: [
    { name: 'remoteDevicePubkey', type: 'string', required: true },
    { name: 'rendezvousTopic', type: 'string', required: true },
    { name: 'displayName', type: 'string', required: true },
    { name: 'deviceType', type: 'string', required: true },
    { name: 'isMine', type: 'bool', required: true },
    { name: 'autoAccept', type: 'bool', required: true },
    { name: 'blocked', type: 'bool', required: true },
    { name: 'pairedAt', type: 'uint', required: true },
    { name: 'lastSeenAt', type: 'uint', required: true }
  ]
})

Hyperschema.toDisk(schema, { esm: true })

const db = HyperDB.from(SCHEMA_DIR, DB_DIR)
const dbns = db.namespace('altersend')

dbns.collections.register({
  name: 'remembered-peers',
  schema: '@altersend/remembered-peer',
  key: ['remoteDevicePubkey']
})

HyperDB.toDisk(db, { esm: true })

const dbTypes =
  'declare const definition: unknown\n' +
  'export default definition\n'
fs.writeFileSync(path.join(DB_DIR, 'index.d.ts'), dbTypes)

console.log('schema written to', SCHEMA_DIR, 'and', DB_DIR)

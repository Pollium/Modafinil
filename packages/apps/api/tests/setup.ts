import pg from 'pg';

const databaseUrl = 'postgres://modafinil:modafinil@localhost:5444/modafinil';
const schema = `api_test_${(process.env.VITEST_POOL_ID ?? '1').replace(/\W/g, '')}`;

Object.assign(process.env, {
    PORT: '3004',
    DATABASE_URL: databaseUrl,
    DATABASE_SCHEMA: schema,
    LOG_LEVEL: 'silent',
    LOG_PRETTY: 'false',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6391',
    MONITORS: JSON.stringify([
        { id: 'api', name: 'API', url: 'http://api.test/health', blurb: 'api.example.com' },
        { id: 'site', name: 'Site', url: 'http://site.test/' },
        { id: 'storage', name: 'Storage', url: 'http://storage.test/', anyStatus: true }
    ])
});

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
await client.query(`CREATE SCHEMA "${schema}"`);
await client.end();

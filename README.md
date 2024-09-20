### MONGO NESTJS

## Api url

`http://localhost:3005/api`

## migration steps

# step 1

`npx migrate-mongo create <replace with collection name>`

# step 2

- it create `.js` file src/migrations folder make it `.ts` file (if other then file extension changed then it not properly )

# step 3

- write migration in that file

```js
module.exports = {
  /*
   create collection using mongodb basic js code
  **/
  async up(db, client) {
    await db.collection('store').updateMany({}, { $set: { deleted_at: null } });
    await db.collection('store').createIndex({ deleted_at: 1 });
  },

  async down(db, client) {
    await db.collection('store').updateMany({}, { $unset: { deleted_at: '' } });
    await db.collection('store').dropIndex('deleted_at_1');
  },
};
```

## start application

<h3> make sure upper all migration step is before running application  </h3>
- npm
`npm run start:dev`
- bun
`bun run start:dev`
- pnpm
`pnpm run start:dev`

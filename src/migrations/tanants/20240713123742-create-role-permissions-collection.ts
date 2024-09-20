module.exports = {
  async up(db, client) {
    await db.createCollection('role_permissions');
    await db.collection('role_permissions').createIndex({ role_id: 1, permission_id: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('role_permissions').drop();
  }
};

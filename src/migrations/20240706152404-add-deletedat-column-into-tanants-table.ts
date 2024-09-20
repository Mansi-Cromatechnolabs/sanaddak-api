module.exports = {
  async up(db, client) {
    await db.collection('tanants').updateMany({}, { $set: { deleted_at: null } });
    await db.collection('tanants').createIndex({ deleted_at: 1 });
  },

  async down(db, client) {
    await db.collection('tanants').updateMany({}, { $unset: { deleted_at: "" } });
    await db.collection('tanants').dropIndex('deleted_at_1');
  }
};

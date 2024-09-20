module.exports = {
    async up(db, client) {
        await db.createCollection('user_role');
        await db.collection('user_role').createIndex({ user_id: 1, role_id: 1 }, { unique: true });
    },

    async down(db, client) {
        await db.collection('user_role').drop();
    }
};

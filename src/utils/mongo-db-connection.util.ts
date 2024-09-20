import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import * as migrateMongo from 'migrate-mongo';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { SeederModule } from 'src/app/seeder/seeder.module';
import { SeederService } from 'src/app/seeder/seeder.service';
const config = require(path.join(__dirname, '../../migrate-mongo-config'));

@Injectable()
export class MongoDbConnection implements OnApplicationBootstrap {
    private db: Db;
    private client: MongoClient;
    private dbs: any[];

    private async connectToDatabase(tanant) {
        const client = new MongoClient(config.mongodb.url, config.mongodb.options);
        await client.connect();
        this.client = client;
        this.db = client.db(tanant);
    }

    private setMigrationsDir(directory: string) {
        migrateMongo.config.set({
            ...config,
            migrationsDir: directory,
        });
    }

    async executePendingMigrations(dbname, migrationsDir) {
        try {
            this.setMigrationsDir(migrationsDir);
            const { up } = migrateMongo;
            await this.connectToDatabase(dbname);
            await up(this.db, this.client);
            return true;
        } catch (error) {
            console.error('Error retrieving pending migrations:', error);
            throw error;
        }
    }

    async getTanants() {
        try {
            const collection = this.db.collection('tanants');
            const tanants = await collection.find({ is_active: true }).toArray();
            return tanants.map(tanant => tanant.db_name);
        } catch (error) {
            console.error('Error retrieving getting tanants:', error);
            throw error;
        }
    }

    async executePendingTanantMigrations() {
        try {
            let tanants = await this.getTanants();
            this.dbs = tanants;
            const migrationsDir = path.join(__dirname, '..', 'migrations', 'tanants');
            tanants.forEach(async tanant => {
                await this.executePendingMigrations(tanant, migrationsDir);
            });
            return true;
        } catch (error) {
            console.error('Error retrieving pending tanant migrations:', error);
            throw error;
        }
    }

    async executePendingSeeders() {
        try {
            let app = await NestFactory.createApplicationContext(SeederModule);
            const seeder = app.get(SeederService);
            await seeder.seed();
            this.dbs.forEach(async tanant => {
                await seeder.tanantSeed(tanant);
            });
            await app.close();
        } catch (error) {
            console.error('Error retrieving pending seeder:', error);
            throw error;
        }
    }

    async onApplicationBootstrap(): Promise<void> {
        try {
            console.log('Migration process starting...');
            await this.executePendingMigrations(config.mongodb.databaseName, path.join(__dirname, '..', 'migrations'));
            await this.executePendingTanantMigrations();
            console.log('Migration process completed successfully.');
            console.log('Seeder process starting.');
            await this.executePendingSeeders();
            console.log('Seeder process completed successfully.');
        } catch (error) {
            console.error('Migration process failed:', error);
        }
    }
}

export async function executeSeeder(tanant) {
    let app = await NestFactory.createApplicationContext(SeederModule);
    const seeder = app.get(SeederService);
    await seeder.tanantSeed(tanant);
}

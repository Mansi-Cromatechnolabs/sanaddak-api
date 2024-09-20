import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder.service';
import { SeederModule } from './seeder.module';

export async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeederModule);
    const seeder = app.get(SeederService);
    await seeder.seed();
    await app.close();
}

bootstrap()
    .then(() => {
        console.log('Seeding complete!');
    })
    .catch((error) => {
        console.error('Seeding failed!', error);
    });

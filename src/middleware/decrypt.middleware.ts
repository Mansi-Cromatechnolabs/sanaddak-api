// import { Body, Injectable, NestMiddleware } from '@nestjs/common';
// import { createDecipheriv } from 'crypto';
// import { Request } from 'express';
// @Injectable()
// export class DecryptMiddleware implements NestMiddleware {
//   use(req: any,res:Request, next: (error?: Error | any) => void) {
//     try {
//       const encryptedBody = req.body.data;
//       const key = Buffer.from(process.env.AES_KEY, 'hex');
//       const iv = Buffer.from(process.env.AES_IV, 'hex');
       
//       const decipher = createDecipheriv(
//         'aes-256-cbc',
//         key,
//         iv, 
//       );
      
//       let decrypted = decipher.update(encryptedBody, 'hex', 'utf8');
//       decrypted += decipher.final('utf8');
//       req.body = JSON.parse(decrypted);
      
//     } catch (error) {
//         console.log(error.message);
//     }
//     next();
//   }
// }

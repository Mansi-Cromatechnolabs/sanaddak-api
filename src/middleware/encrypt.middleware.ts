// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { createCipheriv } from 'crypto';

// @Injectable()
// export class EncryptMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: (error?: Error | any) => void) {
//     const NewResponse = res.send.bind(res);
//     res.send = (body: any) => {
        
//       const key = Buffer.from(process.env.AES_KEY, 'hex');
//       const iv = Buffer.from(process.env.AES_IV, 'hex');

//       const cipher = createCipheriv('aes-256-cbc', key, iv);
//       let encrypted = cipher.update(body, 'utf8', 'hex');
//       encrypted += cipher.final('hex');

//       console.log(encrypted);

//       return NewResponse(encrypted);
//     };
//     next();
//   }
// }

import { Provider } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export const TenantProvider: Provider = {
  provide: 'TENANT',
  useFactory: async (
    request: any,
    connection: Connection,
  ): Promise<any> => {
    return connection.useDb(request.tenant,{ useCache: true })
  },
  inject: [REQUEST, getConnectionToken('MASTER')], 
};

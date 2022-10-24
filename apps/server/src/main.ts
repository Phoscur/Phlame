/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from './app/app.module';

import {
  createLiveQueryStore, createContext,
  addGraphQL, addGraphqlWSServer, addGraphqlSocketIOServer,
  registerSIGINT,
} from './express-live-query';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = parseInt(process.env.PORT) || 4000;
  const context = createContext(createLiveQueryStore());
  addGraphQL(app, context);
  await app.listen(port, () => {
    Logger.log(`🚀 Nest Server listening at http://localhost:${port}/${globalPrefix}`);
  });
  const graphqlWs = addGraphqlWSServer(app, context);
  const socketIoServerPort = port + 1;
  const socketIo = addGraphqlSocketIOServer(context);
  await socketIo.server.listen(socketIoServerPort, () => {
    Logger.log(`🚀 GraphQL Socket.IO Server listening at http://localhost:${socketIoServerPort}.`);
  });
  registerSIGINT(app, graphqlWs, socketIo, context);
}

bootstrap();

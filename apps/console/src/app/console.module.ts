import { CommandService } from "./command.service";
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';

import { ConsoleCommandsService } from './console.service';

@Module({
  imports: [ConsoleModule],
  controllers: [],
  providers: [ConsoleCommandsService, CommandService],
})
export class ConsoleCommandsModule {}

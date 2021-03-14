// service.ts - a nestjs provider using console decorators
import { Console, Command, createSpinner } from 'nestjs-console';

@Console()
export class CommandService {
    @Command({
        command: 'dist',
        description: 'List content of a directory'
    })
    async listContent(): Promise<void> {
        // See Ora npm package for details about spinner
        const spin = createSpinner();
        spin.start(`Listing files in directory ${'dir'}`);

        // simulate a long task of 1 seconds
        const files = await new Promise((done) => setTimeout(() => done(['fileA', 'fileB']), 1000));

        spin.succeed('Listing done');

        // send the response to the  cli
        // you could also use process.stdout.write()
        console.log(JSON.stringify(files));
    }
}

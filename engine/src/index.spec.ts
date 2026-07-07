import { Economy } from '.';
import { emptyStock, phelopments } from './lib/examples';

describe('Engine', () => {
  it('should export an Economy engine', () => {
    const eco = new Economy('Gin', emptyStock, phelopments);
    expect(eco).toBeDefined();
  });
});

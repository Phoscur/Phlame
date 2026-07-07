import { Economy } from '.';
import { emptyStock, buildings } from './lib/examples';

describe('Engine', () => {
  it('should export an Economy engine', () => {
    const eco = new Economy('Gin', emptyStock, buildings);
    expect(eco).toBeDefined();
  });
});

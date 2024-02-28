import { Economy, emptyStock, buildings } from '.';

describe('Engine', () => {
  it('should export an Economy engine', () => {
    const eco = new Economy('Gin', emptyStock, buildings);
    expect(eco).toBeDefined();
  });
});

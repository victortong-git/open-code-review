// Simple Jest test to confirm DB connection
import { db } from './models';

describe('Database Connection', () => {
  it('should connect to the opencodereview_test database', async () => {
    await expect(db.sequelize.authenticate()).resolves.not.toThrow();
  });
});

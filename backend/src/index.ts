import { env } from './config/env';
import { app } from './app';
import { logger } from './utils/logger';

app.listen(env.PORT, () => {
  logger.info(`Inviora API server running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

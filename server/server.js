const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectRedis } = require('./utils/redisClient');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;

connectRedis()
  .then(() => {
    console.log('✅ Connected to Redis');
    const server = app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });

    process.on('unhandledRejection', err => {
      console.error('Unhandled Rejection:', err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to Redis:', err);
    process.exit(1);
  });

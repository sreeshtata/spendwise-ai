import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`[SpendWise AI API] Server running on http://localhost:${port}`);
  console.log(`[SpendWise AI API] OpenAPI documentation: http://localhost:${port}/api/v1/docs`);
});

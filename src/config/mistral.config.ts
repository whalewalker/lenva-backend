import { registerAs } from '@nestjs/config';

export default registerAs('mistral', () => ({
  apiKey: process.env.MISTRAL_API_KEY,
}));

/// Config module
import joi from 'joi';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/* Types */
export interface Config {
  connection: {
    type: 'forward-http' | 'reverse-http' | 'forward-ws' | 'reverse-ws';
  };
  plugins: string[];
}

/* Schema */
const schema: joi.ObjectSchema = joi.object({
  connection: joi.object({
    type: joi
      .string()
      .valid('forward-http', 'reverse-http', 'forward-ws', 'reverse-ws')
      .required()
  }),
  plugins: joi
    .array()
    .items(joi.string().pattern(/^[0-9a-zA-Z_-]+$/))
    .required()
});

/* Config */
export let config: Config;
try {
  const rawConfig: string = fs.readFileSync(
    path.resolve(process.cwd(), './config.yaml'),
    'utf-8'
  );
  config = YAML.parse(rawConfig);

  const { error } = schema.validate(config);
  if (error !== undefined) {
    throw error;
  }
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}

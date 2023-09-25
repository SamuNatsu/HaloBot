/// Config schema
import joi from 'joi';

export const configSchema: joi.ObjectSchema = joi.object({
  connection: joi
    .object({
      type: joi
        .string()
        .valid('forward-http', 'reverse-http', 'forward-ws', 'reverse-ws')
        .required(),
      url: joi.string().uri()
    })
    .required()
});

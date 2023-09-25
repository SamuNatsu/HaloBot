/// Plugin schema
import joi from 'joi';

export const pluginSchema: joi.ObjectSchema = joi
  .object({
    meta: joi
      .object({
        name: joi.string().required(),
        author: joi.string().required(),
        info: joi.string().required(),
        priority: joi.number().integer().min(1).max(100).required(),
        version: joi
          .string()
          .pattern(/^(0|[1-9]\d*).(0|[1-9]\d*).(0|[1-9]\d*)$/)
          .required(),
        botVersion: joi
          .string()
          .pattern(/^(0|[1-9]\d*).(0|[1-9]\d*).(0|[1-9]\d*)$/)
          .required()
      })
      .required()
  })
  .unknown(true);

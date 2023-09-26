/// Plugin schema
import joi from 'joi';

export const pluginMetaSchema: joi.ObjectSchema = joi.object({
  name: joi.string().required(),
  namespace: joi
    .string()
    .pattern(/^[0-9a-zA-Z.-]+$/)
    .required(),
  author: joi.string().required(),
  description: joi.string().required(),
  priority: joi.number().integer().min(1).max(100).required(),
  version: joi
    .string()
    .pattern(/^(0|[1-9]\d*).(0|[1-9]\d*).(0|[1-9]\d*)$/)
    .required(),
  botVersion: joi
    .string()
    .pattern(/^(0|[1-9]\d*).(0|[1-9]\d*).(0|[1-9]\d*)$/)
    .required()
});

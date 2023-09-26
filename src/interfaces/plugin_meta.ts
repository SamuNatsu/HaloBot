/// Plugin interface

export interface PluginMeta {
  name: string;
  namespace: string;
  author: string;
  description: string;
  priority: number;
  version: string;
  botVersion: string;
}

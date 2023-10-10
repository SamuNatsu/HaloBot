/// Version info interface

/**
 * Go-CqHttp 版本信息
 */
export interface VersionInfo {
  /**
   * 应用标识
   */
  app_name: 'go-cqhttp';

  /**
   * 应用版本
   */
  app_version: string;

  /**
   * 应用完整名称
   */
  app_full_name: string;

  /**
   * 协议名称
   */
  protocol_name: 6n;

  /**
   * 协议版本
   */
  protocol_version: 'v11';

  /**
   * 原 Coolq 版本
   *
   * @deprecated
   */
  coolq_edition: 'pro';

  /**
   * 原 Coolq 目录
   *
   * @deprecated
   */
  coolq_directory: string;

  /**
   * 是否为 Go-CqHttp
   */
  'go-cqhttp': true;

  /**
   * 插件版本
   */
  plugin_version: '4.15.0';

  /**
   * 插件构建数
   */
  plugin_build_number: 99n;

  /**
   * 插件构建配置
   */
  plugin_build_configuration: 'release';

  /**
   * 运行时版本
   */
  runtime_version: string;

  /**
   * 运行时操作系统
   */
  runtime_os: string;

  /**
   * 应用版本
   */
  version: string;
}

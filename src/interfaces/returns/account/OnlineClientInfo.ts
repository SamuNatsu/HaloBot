/// Online client info interface

/**
 * 在线客户端信息
 */
export interface OnlineClientInfo {
  /**
   * 客户端 ID
   */
  app_id: bigint;

  /**
   * 设备名称
   */
  device_name: string;

  /**
   * 设备类型
   */
  device_kind: string;
}

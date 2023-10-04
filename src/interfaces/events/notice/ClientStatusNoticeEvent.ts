/// Client status notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 其他客户端在线状态变更事件
 */
export interface ClientStatusNoticeEvent extends NoticeEvent {
  notice_type: 'client_status';

  /**
   * 客户端信息
   */
  client: {
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
  };

  /**
   * 当前是否在线
   */
  online: boolean;
}

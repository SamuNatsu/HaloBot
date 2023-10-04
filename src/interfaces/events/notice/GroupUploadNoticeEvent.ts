/// Group upload notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群文件上传事件
 */
export interface GroupUploadNoticeEvent extends NoticeEvent {
  notice_type: 'group_upload';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 文件信息
   */
  file: {
    /**
     * 文件 ID
     */
    id: string;

    /**
     * 文件名
     */
    name: string;

    /**
     * 文件大小
     */
    size: bigint;

    /**
     * busid
     */
    busid: bigint;
  };
}

/// Friend offline file notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 接收到离线文件事件
 */
export interface FriendOfflineFileNoticeEvent extends NoticeEvent {
  notice_type: 'offline_file';

  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 文件数据
   */
  file: {
    /**
     * 文件名
     */
    name: string;

    /**
     * 文件大小
     */
    size: bigint;

    /**
     * 下载链接
     */
    url: string;
  };
}

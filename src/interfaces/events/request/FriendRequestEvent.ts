/// Friend request event interface
import { RequestEvent } from './RequestEvent';

/**
 * 加好友请求事件
 */
export interface FriendRequestEvent extends RequestEvent {
  request_type: 'friend';

  /**
   * 发送请求的 QQ 号
   */
  user_id: bigint;

  /**
   * 验证信息
   */
  comment: string;

  /**
   * 请求 flag
   */
  flag: string;
}

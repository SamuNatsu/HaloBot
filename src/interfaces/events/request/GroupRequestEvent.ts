/// Group request event interface
import { RequestEvent } from './RequestEvent';

/**
 * 加群请求/邀请事件
 */
export interface GroupRequestEvent extends RequestEvent {
  request_type: 'group';

  /**
   * 请求子类型
   */
  sub_type: 'add' | 'invite';

  /**
   * 群号
   */
  group_id: bigint;

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

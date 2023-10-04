/// Group ban notice event interface

import { NoticeEvent } from "./NoticeEvent";

/**
 * 群禁言事件
 */
export interface GroupBanNoticeEvent extends NoticeEvent {
  notice_type: 'group_ban';

  /**
   * 事件子类型
   */
  sub_type: 'ban' | 'lift_ban';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 操作者 QQ 号
   */
  opeator_id: bigint;

  /**
   * 被禁言 QQ 号，为全员禁言时为 0
   */
  user_id: bigint;

  /**
   * 禁言时长，单位秒
   */
  duration: bigint;
}

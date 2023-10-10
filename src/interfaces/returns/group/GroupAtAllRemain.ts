/// Group at all remain interface

/**
 * 群 at 全体成员剩余次数
 */
export interface GroupAtAllRemain {
  /**
   * 是否可以 at 全体成员
   */
  can_at_all: boolean;

  /**
   * 群内所有管理员当天剩余 at 全体成员次数
   */
  remain_at_all_count_for_group: bigint;

  /**
   * Bot 当天剩余 at 全体成员次数
   */
  remain_at_all_count_for_uin: bigint;
}

/// Group member info interface

/**
 * 群成员信息
 */
export interface GroupMemberInfo {
  /**
   * 群号
   */
  group_id: bigint;

  /**
   * QQ 号
   */
  user_id: bigint;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 群名片
   */
  card: string;

  /**
   * 性别
   */
  sex: 'male' | 'female' | 'unknown';

  /**
   * 年龄
   */
  age: bigint;

  /**
   * 地区
   */
  area: string;

  /**
   * 加群时间
   */
  join_time: bigint;

  /**
   * 最后发言时间
   */
  last_sent_time: bigint;

  /**
   * 成员等级
   */
  level: string;

  /**
   * 角色
   */
  role: 'owner' | 'admin' | 'member';

  /**
   * 是否为不良记录成员
   */
  unfriendly: boolean;

  /**
   * 专属头衔
   */
  title: string;

  /**
   * 专属头衔过期时间
   */
  title_expire_time: bigint;

  /**
   * 是否允许修改群名片
   */
  card_changeable: boolean;

  /**
   * 禁言结束时间
   */
  shut_up_timestamp: bigint;
}

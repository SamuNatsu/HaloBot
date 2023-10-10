/// Group info interface

/**
 * 群信息
 */
export interface GroupInfo {
  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 群名
   */
  group_name: string;

  /**
   * 群备注
   */
  group_memo: string;

  /**
   * 群创建时间
   */
  group_create_time: bigint;

  /**
   * 群等级
   */
  group_level: bigint;

  /**
   * 群成员数量
   */
  member_count: bigint;

  /**
   * 群成员容量
   */
  max_member_count: bigint;
}

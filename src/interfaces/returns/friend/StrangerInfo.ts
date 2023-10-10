/// Stranger info interface

/**
 * 陌生人信息
 */
export interface StrangerInfo {
  /**
   * QQ 号
   */
  user_id: bigint;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 性别
   */
  sex: 'male' | 'female' | 'unknown';

  /**
   * 年龄
   */
  age: bigint;

  /**
   * QID
   */
  qid: string;

  /**
   * 等级
   */
  level: bigint;

  /**
   * 等级天数
   */
  login_days: bigint;
}

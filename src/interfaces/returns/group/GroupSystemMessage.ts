/// Group system message interface

/**
 * 群系统消息
 */
export interface GroupSystemMessage {
  /**
   * 邀请消息列表
   */
  invited_requests:
    | {
        /**
         * 请求 ID
         */
        request_id: bigint;

        /**
         * 邀请者 QQ 号
         */
        invitor_uin: bigint;

        /**
         * 邀请者昵称
         */
        invitor_nick: string;

        /**
         * 群号
         */
        group_id: bigint;

        /**
         * 群名
         */
        group_name: string;

        /**
         * 是否已处理
         */
        checked: boolean;

        /**
         * 处理者 QQ 号，未处理时为 0
         */
        actor: bigint;
      }[]
    | null;

  /**
   * 进群消息列表
   */
  join_requests:
    | {
        /**
         * 请求 ID
         */
        request_id: bigint;

        /**
         * 请求者 QQ 号
         */
        requester_uin: bigint;

        /**
         * 请求者昵称
         */
        requester_nick: string;

        /**
         * 验证消息
         */
        message: string;

        /**
         * 群号
         */
        group_id: bigint;

        /**
         * 群名
         */
        group_name: string;

        /**
         * 是否已处理
         */
        checked: boolean;

        /**
         * 处理者 QQ 号，未处理时为 0
         */
        actor: bigint;
      }[]
    | null;
}

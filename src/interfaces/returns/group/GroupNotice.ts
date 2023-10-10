/// Group notice interface

/**
 * 群公告
 */
export interface GroupNotice {
  /**
   * 发布者 QQ 号
   */
  sender_id: bigint;

  /**
   * 发布时间
   */
  publish_time: bigint;

  /**
   * 公告内容
   */
  message: {
    /**
     * 公共文本
     */
    text: string;

    /**
     * 公告图片
     */
    images: {
      /**
       * 图片高度
       */
      height: string;

      /**
       * 图片宽度
       */
      width: string;

      /**
       * 图片 ID
       */
      id: string;
    }[];
  };
}

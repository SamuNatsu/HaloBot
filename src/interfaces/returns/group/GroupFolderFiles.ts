/// Group file folder info

/**
 * 群子目录文件列表
 */
export interface GroupFolderFiles {
  /**
   * 文件列表
   */
  files: {
    /**
     * 群号
     */
    group_id: bigint;

    /**
     * 文件 ID
     */
    file_id: string;

    /**
     * 文件名
     */
    file_name: string;

    /**
     * 文件类型
     */
    busid: bigint;

    /**
     * 文件大小
     */
    file_size: bigint;

    /**
     * 上传时间
     */
    upload_time: bigint;

    /**
     * 过期时间，永久文件恒为 0
     */
    dead_time: bigint;

    /**
     * 最后修改时间
     */
    modify_time: bigint;

    /**
     * 下载次数
     */
    download_times: bigint;

    /**
     * 上传者 QQ 号
     */
    uploader: bigint;

    /**
     * 上传者名字
     */
    uploader_name: string;
  }[];

  /**
   * 文件夹列表
   */
  folders: {
    /**
     * 群号
     */
    group_id: bigint;

    /**
     * 文件夹 ID
     */
    folder_id: string;

    /**
     * 文件夹名
     */
    folder_name: string;

    /**
     * 创建时间
     */
    create_time: bigint;

    /**
     * 创建者 QQ 号
     */
    creator: bigint;

    /**
     * 创建者名字
     */
    creator_name: string;

    /**
     * 子文件数量
     */
    total_file_count: bigint;
  }[];
}

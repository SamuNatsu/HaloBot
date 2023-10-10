/// Group file system info interface

/**
 * 群文件系统信息
 */
export interface GroupFileSystemInfo {
  /**
   * 文件总数
   */
  file_count: bigint;

  /**
   * 文件数量上限
   */
  limit_count: bigint;

  /**
   * 已用空间
   */
  used_space: bigint;

  /**
   * 空间上限
   */
  total_space: bigint;
}

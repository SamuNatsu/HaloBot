/// Image file info interface

/**
 * 图片文件信息
 */
export interface ImageFileInfo {
  /**
   * 文件大小
   */
  size: bigint;

  /**
   * 文件名
   */
  filename: string;

  /**
   * 下载地址
   */
  url: string;
}

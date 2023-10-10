/// Image OCR data interface

/**
 * 图片 OCR 结果
 */
export interface ImageOcrResult {
  /**
   * OCR 结果
   */
  texts: {
    /**
     * 文本
     */
    text: string;

    /**
     * 置信度
     */
    confidence: bigint;

    /**
     * 坐标
     */
    coordinates: number[];
  }[];

  /**
   * 语言
   */
  language: string;
}

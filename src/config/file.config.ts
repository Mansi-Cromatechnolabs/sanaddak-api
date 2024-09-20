import { join } from 'path';
import { FILE_CONSTANT as FILE } from './constant.config';


export const sizeMap: Record<string, number> = {
    'image/jpeg': FILE.IMAGE_SIZE, // 1 MB
    'image/png': FILE.IMAGE_SIZE, // 1 MB
    'text/csv': FILE.CSV_SIZE, // 0.5 MB
    'application/pdf': FILE.PDF_SIZE, // 2 MB
    'application/msword': FILE.DOC_SIZE, // 2 MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        FILE.DOC_SIZE, // 2 MB
};

export const directoryMap: Record<string, string> = {
    'image/jpeg': FILE.IMAGE_DIR,
    'image/png': FILE.IMAGE_DIR,
    'text/csv': FILE.CSV_DIR,
    'application/pdf': FILE.DOC_DIR,
    'application/msword': FILE.DOC_DIR,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        FILE.DOC_DIR,
};

export const dir = join(__dirname, '..', '..', FILE.ROOT_DIR);

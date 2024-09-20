import { join } from 'path';
import * as fs from 'fs';
import { directoryMap, dir } from '../config/file.config';
import * as puppeteer from 'puppeteer';
import { handleDocumentUpload } from './agreement.util';

export type File = Express.Multer.File;

export interface MultipleFiles {
  [key: string]: File;
}

const directory = (mimetype: string): string => {
  return directoryMap[mimetype];
};

const createDirectory = (path: string) => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path, { recursive: true });
    } catch (error) {
      throw Error('Error occurred while creating folder');
    }
  }
};

// function to upload the file (form can have only one file field and at most one file can be uploaded at once)
const fileUpload = (file: File, id: number) => {
  const folderName = directory(file.mimetype);
  const folder = join(dir, id.toString(), folderName);
  createDirectory(folder);

  const path = folder + file.originalname;
  try {
    fs.writeFileSync(path, file.buffer);
    return path;
  } catch (error) {
    throw new Error(error);
  }
};

const profileImageUpload = (file: File, folderName: string) => {
  const folder = join(__dirname, `../../uploads/${folderName}`);
  createDirectory(folder);

  const path = join(folder, file.originalname);
  try {
    fs.writeFileSync(path, file.buffer);
    return path;
  } catch (error) {
    throw new Error(error);
  }
};

const documentUpload = (
  file,
  folderName: string,
  user_id: string,
  file_extention: string,
) => {
  const folder = join(__dirname, `../../uploads/${folderName}`);
  createDirectory(folder);

  const path = join(folder, `${user_id}` + `.${file_extention}`);
  try {
    file.pipe(fs.createWriteStream(path));
    return path;
  } catch (error) {
    throw new Error(error);
  }
};

const deleteFile = (filePath: string): void => {
  try {
    fs.unlinkSync('uploads/' + filePath);
  } catch (error) {
    throw new Error(error);
  }
};

const fileUploads = (files: Array<File>, id: number) => {
  return files.map((file) => fileUpload(file, id));
};

const generatePdf = async (
  agreements: { name: string; body: string }[],
  folderName: string,
  customer_id: string,
  loan_id: string,
): Promise<string> => {
  const htmlContent = agreements
    .map(
      (agreement) => `
    <div style="page-break-after: always;">
    ${agreement.body}
    </div>
    `,
    )
    .join('');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '30px',
      bottom: '20px',
      left: '25px',
      right: '20px',
    },
  });

  await browser.close();

  const contentType = 'application/pdf';
  const file_extention = '.pdf';
  const fileName = `${customer_id}/${loan_id}/${folderName}_${loan_id}_${customer_id}${file_extention}`;
  const fileUrl = await handleDocumentUpload(
    fileName,
    pdfBuffer,
    contentType,
  );
  return fileUrl;
};

export {
  fileUpload,
  fileUploads,
  deleteFile,
  profileImageUpload,
  documentUpload,
  generatePdf,
};

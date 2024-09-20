import * as bwipjs from 'bwip-js';
import { createCanvas, loadImage } from 'canvas';
import { handleDocumentUpload } from './agreement.util';

export const printBarcode = async (
  barcodeData,
  folderName: string,
  liquidity_id?: string,
  customer_id?: string,
  item_id?: string,
) => {
  const desiredHeight = 15;
  const desiredWidth = 70;
  const marginLeft = 10;
  const marginRight = 10;
  const scale = desiredWidth / (barcodeData.length * 2);

  const barcodeOptions: {
    bcid: string;
    text: string;
    scale: number;
    height: number;
    includetext: boolean;
    textabove: boolean;
    textxalign:
      | 'center'
      | 'offleft'
      | 'left'
      | 'right'
      | 'offright'
      | 'justify';
  } = {
    bcid: 'code128',
    text: barcodeData,
    scale: scale,
    height: desiredHeight,
    includetext: true,
    textabove: true,
    textxalign: 'center',
  };

  const barcodeBuffer = await bwipjs.toBuffer(barcodeOptions);
  const barcodeImage = await loadImage(barcodeBuffer);

  const canvasWidth = barcodeImage.width + marginLeft + marginRight;
  const canvasHeight = barcodeImage.height + 30;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SANADDAK', canvasWidth / 2, 20);

  ctx.drawImage(barcodeImage, marginLeft, 30);

  const finalImageBuffer = canvas.toBuffer('image/png');
  const contentType = 'image/png';
  const file_extention = '.png';
  let fileName;
  if(!liquidity_id){
    fileName = `${folderName}_${barcodeData}${file_extention}`;
  }else if (item_id) {
     fileName = `${customer_id}/${liquidity_id}/${folderName}_${item_id}${file_extention}`;
  } else {
     fileName = `${customer_id}/${liquidity_id}/${folderName}_${liquidity_id}${file_extention}`;
  }

  const fileUrl = await handleDocumentUpload(
    fileName,
    finalImageBuffer,
    contentType,
  );
  return fileUrl;
};

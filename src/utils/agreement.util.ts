import * as AWS from 'aws-sdk';

export const handleDocumentUpload = async (
  fileName: string,
  pdffile,
  contentType: string,
) => {
  AWS.config.update({
    accessKeyId: process.env.NEST_PUBLIC_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEST_PUBLIC_S3_SECRET_ACCESS_KEY,
    region: process.env.NEST_PUBLIC_S3_PUBLIC_REGION,
  });
  const s3 = new AWS.S3();
  try {
    const params = {
      Bucket: process.env.NEST_PUBLIC_S3_BUCKET_NAME,
      Key: fileName,
      Expires: 60,
      ContentType: contentType,
      ACL: 'public-read',
    };
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: pdffile,
    });
    if (response.ok) {
      console.log(`uploaded successfully!`);
      const result = uploadUrl.split('?')[0];
      return result;
    } else {
      console.error(`Failed to upload:`, response.statusText);
    }
  } catch (error) {
    console.error('Error uploading files:', error);
  }
};

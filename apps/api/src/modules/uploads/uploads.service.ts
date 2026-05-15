import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });
    this.bucket = process.env.S3_BUCKET || 'next-tickets';
  }

  async upload(file: Express.Multer.File) {
    const key = `${Date.now()}-${crypto.randomUUID()}/${file.originalname}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    const url = `${process.env.S3_PUBLIC_URL || `http://localhost:9000/${this.bucket}`}/${key}`;
    return { url, key };
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

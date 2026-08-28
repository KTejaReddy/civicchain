import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function uploadToIPFS(file: Express.Multer.File): Promise<string> {
  const uploadDir = path.resolve(UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cid = uuidv4();
  const ext = path.extname(file.originalname);
  const filename = `${cid}${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  return cid;
}

export async function uploadBase64ToIPFS(base64: string, filename: string): Promise<string> {
  const uploadDir = path.resolve(UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cid = uuidv4();
  const ext = path.extname(filename);
  const safeFilename = `${cid}${ext}`;
  const filePath = path.join(uploadDir, safeFilename);

  const base64Data = base64.replace(/^data:[a-z]+\/[a-z]+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  return cid;
}

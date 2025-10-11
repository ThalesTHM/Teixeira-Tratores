"server only";

import { adminStorage } from "../../firebase/firebase-admin";
import { getUserFromSession } from "../../lib/auth";
import { Bucket } from '@google-cloud/storage';

type UploadableFile = Buffer | {
    buffer?: Buffer;
    type?: string;
    arrayBuffer?: () => Promise<ArrayBuffer>;
};

export class StorageService {
    private adminStorage: any;
    private bucket: Bucket;

    constructor() {
        this.adminStorage = adminStorage;
        const bucketName = process.env.GCLOUD_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) throw new Error('Bucket name not set in environment variables');
        this.bucket = this.adminStorage.bucket(bucketName);
    }


    async _requireSession(): Promise<any> {
        const user = await getUserFromSession();
        if (!user) {
            throw new Error("Unauthorized");
        }
        return user;
    }

    async uploadFile(file: UploadableFile, path: string): Promise<string> {
        await this._requireSession();

        const fileUpload = this.bucket.file(path);

        // Type guard for file type
        let contentType = 'application/octet-stream';
        if (typeof file === 'object' && file !== null && 'type' in file && typeof file.type === 'string') {
            contentType = file.type;
        }
        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType,
            },
        });

        // Support both Buffer and File objects
        let fileData: Buffer;
        if (file instanceof Buffer) {
            fileData = file;
        } else if (file && typeof file === 'object') {
            if (file.buffer && Buffer.isBuffer(file.buffer)) {
                fileData = file.buffer;
            } else if (
                typeof (file as any).arrayBuffer === 'function'
            ) {
                fileData = Buffer.from(await (file as any).arrayBuffer());
            } else {
                throw new Error('Invalid file format for upload');
            }
        } else {
            throw new Error('Invalid file format for upload');
        }

        return new Promise<string>((resolve, reject) => {
            stream.on('error', (error: Error) => {
                reject(new Error(`Upload failed: ${error.message}`));
            });

            stream.on('finish', async () => {
                try {
                    // Return the file path instead of making it public
                    resolve(path);
                } catch (error: any) {
                    reject(new Error(`Upload finished but failed to return path: ${error.message}`));
                }
            });

            stream.end(fileData);
        });
    }

    async deleteFile(path: string): Promise<void> {
        await this._requireSession();

        const file = this.bucket.file(path);
        await file.delete();
    }

    async generateSignedUrl(path: string, expirationMinutes: number = 60): Promise<string> {
        await this._requireSession();

        const file = this.bucket.file(path);
        const [exists] = await file.exists();

        if (!exists) {
            throw new Error("File not found");
        }

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + (expirationMinutes * 60 * 1000)
        });

        return signedUrl;
    }

    async updateFile(file: UploadableFile, path: string, entity: string = 'temp'): Promise<string> {
        await this._requireSession();

        path = path
            .replace(this.bucket.name + "/", '')
            .replace("https://adminStorage.googleapis.com/", '');

        const existingFile = this.bucket.file(path);
        const [exists] = await existingFile.exists();

        if (!exists) {
            throw new Error("File not found");
        }

        await this.deleteFile(path);

        const tempId = Date.now().toString();
        const newPath = `${entity}/${tempId}/file`;

        return await this.uploadFile(file, newPath);
    }

    async getFileUrl(path: string): Promise<string> {
        const file = this.bucket.file(path);
        const [exists] = await file.exists();

        if (!exists) {
            throw new Error("File not found");
        }

        // Return the path instead of public URL
        return path;
    }

    async listFiles(prefix: string = ''): Promise<Array<{
        name: string;
        size: string;
        contentType: string;
        created: string;
        updated: string;
        path: string;
    }>> {
        await this._requireSession();
        const [files] = await this.bucket.getFiles({ prefix });
        return files.map(file => ({
            name: file.name,
            size: String(file.metadata.size ?? ''),
            contentType: String(file.metadata.contentType ?? ''),
            created: String(file.metadata.timeCreated ?? ''),
            updated: String(file.metadata.updated ?? ''),
            path: file.name // Return path instead of public URL
        }));
    }
}
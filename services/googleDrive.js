import { google } from "googleapis"
import * as path from 'path'
import * as fs from 'fs'
import { GOOGLE_DRIVE } from "../constants.js"

const getDriveService = () => {
    const filePath = path.resolve('service_account.json');
    const scopes = 'https://www.googleapis.com/auth/drive'
    const auth = new google.auth.GoogleAuth({
        keyFile: filePath,
        scopes: scopes,
    });
    const driveService = google.drive({ version: 'v3', auth });
    return driveService;
}

const service = getDriveService()


export const uploadFile = async (folderId, filePath, retries = 0) => {
    const fileName = path.basename(filePath)
    return service.files.create({
        resource: {
            name: fileName,
            parents: [folderId]
        },
        media: {
            mimeType: "image/jpeg",
            body: fs.createReadStream(filePath)
        },
        fields: 'id,name',
    }).catch((error) => {
        if (retries < 4) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(uploadFile(folderId, filePath, retries + 1))
                }, 5000)
            })
        }
        else {
            throw error
        }
    })
}

export const uploadFolder = async (folderPath) => {
    const folderName = path.basename(folderPath)
    console.log("folderNaem", folderName)
    const folderId = await service.files.create({
        resource: {
            name: folderName,
            parents: [GOOGLE_DRIVE.folderId],
            mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
    }).then((file) => file.data.id)

    const files = fs.readdirSync(folderPath)
    await Promise.all(files.map(file => uploadFile(folderId, path.resolve(folderPath, file))))
    return `https://drive.google.com/drive/u/0/folders/${folderId}`
}